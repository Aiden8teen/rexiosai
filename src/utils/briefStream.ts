import { ApiError } from '../api/client';
import type { BriefProgress, BriefResult, BriefStreamEvent } from '../api/contracts';

/** Decode SSE frames independently of HTTP chunk and UTF-8 boundaries. */
export async function readBriefStream(body: ReadableStream<Uint8Array>, onProgress: (event: BriefProgress) => void, signal?: AbortSignal): Promise<BriefResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        let event: BriefStreamEvent;
        try { event = JSON.parse(data) as BriefStreamEvent; }
        catch { throw new ApiError('The draft connection could not be read. Please retry.', 0, 'INVALID_STREAM'); }
        if (event.type === 'error') throw new ApiError(event.message, event.status);
        if (event.type === 'complete') return event.result;
        if (event.type === 'phase' || event.type === 'preview') onProgress(event);
      }
      if (done) throw new ApiError('The connection ended before the draft could finish. Please retry.', 0, 'INCOMPLETE_STREAM');
    }
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
