import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BriefPreviewParser } from '../src/ai/challenge-brief.stream';
import { generateChallengeBrief } from '../src/ai/challenge-brief.graph';
import type { BriefModel } from '../src/ai/featherless.client';

test('preview emits only completed draft fields across escaped strings, Arabic, arrays and fences', () => {
  const parser = new BriefPreviewParser();
  assert.deepEqual(parser.push('```json\n{"status":"draft","draft":{"title":"مشكلة '), []);
  const first = parser.push('صناعية"');
  assert.equal(first.at(-1)?.title, 'مشكلة صناعية');
  assert.equal(first.at(-1)?.descriptionEn, undefined);
  const snapshots = parser.push(',"descriptionEn":"Keep {braces}, \\"quotes\\" and newlines\\nintact.","skills":["PYTHON"],"budgetDzd":120000,');
  assert.equal(snapshots.at(-1)?.descriptionEn, 'Keep {braces}, "quotes" and newlines\nintact.');
  assert.deepEqual(snapshots.at(-1)?.skills, ['PYTHON']);
  assert.equal(snapshots.at(-1)?.budgetDzd, 120000);
  assert.deepEqual(parser.push('"titleEn":"unfinished'), []);
});

test('preview refuses unsupported or invalid fields and distinguishes null from incomplete numbers', () => {
  const parser = new BriefPreviewParser();
  const snapshots = parser.push('{"draft":{"skills":["INVALID"],"privateNotes":"never","budgetDzd":null,"applicationDeadlineDate":"2027-02-30","titleEn":"Useful title"}}');
  const last = snapshots.at(-1)!;
  assert.equal(last.budgetDzd, null);
  assert.equal(last.skills, undefined);
  assert.equal(last.applicationDeadlineDate, undefined);
  assert.equal(Object.hasOwn(last, 'privateNotes'), false);
  assert.equal(last.titleEn, 'Useful title');
});

test('graph streams provisional content before completion and resets the attempt on repair', async () => {
  const events: any[] = [];
  let calls = 0;
  const valid = JSON.stringify({ status: 'needs_context', draft: null, fieldSources: {}, questions: [{ id: 'context', field: 'context', text: { ar: 'ما المشكلة؟', en: 'What is the problem?' } }], warnings: [] });
  const model: BriefModel = {
    async complete() { throw new Error('Must use streaming'); },
    async *stream() {
      calls++;
      if (calls === 1) { yield '{"draft":{"titleEn":"A provisional title"},'; assert.ok(events.some(event => event.type === 'preview')); yield 'bad'; }
      else yield valid;
    },
  };
  const result = await generateChallengeBrief({ notes: 'Hello', lang: 'en' }, model, { signal: new AbortController().signal, now: new Date(), maxRepairAttempts: 2, onProgress: event => { events.push(event); } });
  assert.equal(result.status, 'needs_context');
  assert.ok(events.some(event => event.type === 'phase' && event.phase === 'repairing'));
  assert.ok(events.some(event => event.type === 'phase' && event.phase === 'drafting' && event.attempt === 1));
  assert.equal(calls, 2);
});
