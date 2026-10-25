import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBriefStream } from '../../src/utils/briefStream';

const result = { status: 'needs_context', draft: null, fieldSources: {}, questions: [{ id: 'q', field: 'context', text: { ar: 'ما المشكلة؟', en: 'What is the problem?' } }], warnings: [] };
const encode = (value: unknown) => `event: brief\r\ndata: ${JSON.stringify(value)}\r\n\r\n`;

test('SSE reader yields progress before final output with arbitrary UTF-8 and CRLF boundaries', async () => {
  const progress: any[] = [];
  const bytes = new TextEncoder().encode(': heartbeat\r\n\r\n' + encode({ type: 'preview', attempt: 0, draft: { title: 'حل صناعي' } }) + encode({ type: 'complete', result }));
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({ pull(controller) {
    if (offset >= bytes.length) { controller.close(); return; }
    controller.enqueue(bytes.slice(offset, offset + 1)); offset++;
  } });
  assert.deepEqual(await readBriefStream(stream, event => progress.push(event)), result);
  assert.equal(progress.length, 1);
  assert.equal(progress[0].draft.title, 'حل صناعي');
});

test('SSE reader rejects terminal provider errors and a truncated stream instead of applying partial fields', async () => {
  for (const [wire, message] of [
    [encode({ type: 'error', status: 503, message: 'Try again shortly.' }), /Try again shortly/],
    [encode({ type: 'preview', attempt: 0, draft: { titleEn: 'Partial only' } }), /connection|finish|ended/i],
  ] as const) {
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(wire)); controller.close(); } });
    await assert.rejects(readBriefStream(stream, () => {}), message);
  }
});
