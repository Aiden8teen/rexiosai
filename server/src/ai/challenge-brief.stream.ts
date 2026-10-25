import { briefDraftSchema, type BriefDraft, type BriefField, type BriefResult } from './challenge-brief.schema';

export type BriefProgress =
  | { type: 'phase'; phase: 'drafting' | 'checking' | 'repairing'; attempt: number }
  | { type: 'preview'; draft: Partial<BriefDraft>; attempt: number };
export type BriefStreamEvent = BriefProgress
  | { type: 'complete'; result: BriefResult }
  | { type: 'error'; status: number; message: string };

type Frame = { kind: 'object' | 'array'; path: string[]; start: number; key?: string; expectsKey: boolean };

/** Read complete JSON values incrementally, never repair/execute partial JSON.
 * Provisional fields pass their individual schemas; the full result still needs validation.
 */
export class BriefPreviewParser {
  private buffer = '';
  private cursor = 0;
  private started = false;
  private frames: Frame[] = [];
  private stringStart: number | null = null;
  private primitiveStart: number | null = null;
  private escaped = false;
  private isKey = false;
  private draft: Partial<BriefDraft> = {};

  push(chunk: string): Partial<BriefDraft>[] {
    this.buffer += chunk;
    const updates: Partial<BriefDraft>[] = [];
    if (!this.started) {
      const prefix = /^\s*(?:```(?:json)?\s*)?(?=\{)/i.exec(this.buffer);
      if (!prefix) return updates;
      this.cursor = prefix[0].length;
      this.started = true;
    }
    const completeValue = (start: number, end: number) => {
      const parent = this.frames.at(-1);
      if (!parent) return;
      const key = parent.key;
      if (parent.path.length === 1 && parent.path[0] === 'draft' && key && Object.hasOwn(briefDraftSchema.shape, key)) {
        try {
          const field = key as BriefField;
          const parsed = briefDraftSchema.shape[field].safeParse(JSON.parse(this.buffer.slice(start, end)));
          if (parsed.success) {
            this.draft = { ...this.draft, [field]: parsed.data };
            updates.push(this.draft);
          }
        } catch { /* Incomplete/invalid fields wait for the final validation/repair. */ }
      }
      parent.key = undefined;
    };

    while (this.cursor < this.buffer.length) {
      const char = this.buffer[this.cursor];
      if (this.stringStart !== null) {
        if (this.escaped) this.escaped = false;
        else if (char === '\\') this.escaped = true;
        else if (char === '"') {
          const start = this.stringStart;
          this.stringStart = null;
          if (this.isKey) {
            try { this.frames.at(-1)!.key = JSON.parse(this.buffer.slice(start, this.cursor + 1)); }
            catch { return updates; }
            this.frames.at(-1)!.expectsKey = false;
          } else completeValue(start, this.cursor + 1);
        }
        this.cursor++;
        continue;
      }
      if (this.primitiveStart !== null) {
        if (!/[\s,}\]]/.test(char)) { this.cursor++; continue; }
        completeValue(this.primitiveStart, this.cursor);
        this.primitiveStart = null;
      }
      if (char === '"') {
        this.stringStart = this.cursor;
        this.isKey = this.frames.at(-1)?.kind === 'object' && this.frames.at(-1)!.expectsKey;
      } else if (char === '{' || char === '[') {
        const parent = this.frames.at(-1);
        this.frames.push({ kind: char === '{' ? 'object' : 'array', path: parent ? [...parent.path, parent.key || '[]'] : [], start: this.cursor, expectsKey: char === '{' });
      } else if (char === '}' || char === ']') {
        const frame = this.frames.pop();
        if (frame) completeValue(frame.start, this.cursor + 1);
        if (!this.frames.length) { this.cursor = this.buffer.length; break; }
      } else if (char === ',') {
        const frame = this.frames.at(-1);
        if (frame?.kind === 'object') frame.expectsKey = true;
      } else if (!/[\s:]/.test(char)) this.primitiveStart = this.cursor;
      this.cursor++;
    }
    return updates;
  }
}
