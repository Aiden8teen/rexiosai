import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import { buildBriefMessages, buildRepairMessages } from '../src/ai/challenge-brief.prompt';
import { AiUnavailableError, createFeatherlessModel } from '../src/ai/featherless.client';
import { parseAndValidateBrief, parseBriefRequest } from '../src/ai/challenge-brief.schema';

const context = { now: new Date('2026-10-25T10:00:00.000Z'), timeZone: 'Africa/Algiers' };
const request = parseBriefRequest({
  notes: 'A textile shop wants to log seam defects. Budget is not set.',
  lang: 'en',
});

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test('both prompt languages include valid positive and rejection examples, including repairs', () => {
  for (const lang of ['ar', 'en'] as const) {
    const input = { ...request, lang };
    for (const messages of [buildBriefMessages(input, context), buildRepairMessages(input, 'bad JSON', ['Invalid JSON'], context)]) {
      const examples = messages.filter(message => message.type === 'ai').map(message => parseAndValidateBrief(String(message.content), context));
      assert.ok(examples.some(example => example.status === 'draft'));
      const rejections = examples.filter(example => example.status === 'needs_context');
      assert.ok(rejections.length >= 2, 'Show both unrelated and instruction-override rejection cases');
      assert.ok(rejections.every(example => example.draft === null && example.questions.length > 0));
    }
  }
});

test('sends LangChain few-shot messages to Chat Completions and returns only final content', async t => {
  const finalContent = '{"status":"draft","draft":null}';
  const received: Array<{ path: string | undefined; authorization: string | undefined; body: Record<string, unknown> }> = [];
  const server = createServer(async (incoming, response) => {
    const body = JSON.parse(await readBody(incoming)) as Record<string, unknown>;
    received.push({ path: incoming.url, authorization: incoming.headers.authorization, body });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 1,
      model: 'test/model',
      choices: [{ index: 0, finish_reason: 'stop', message: {
        role: 'assistant',
        content: [
          { type: 'text', text: finalContent },
          { type: 'reasoning', text: 'Reasoning text blocks must not be returned.' },
        ],
        reasoning_content: 'This separate reasoning field must not be returned.',
      } }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    }));
  });
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const messages = buildBriefMessages(request, context);
  const client = createFeatherlessModel({
    model: 'test/model',
    baseURL: `http://127.0.0.1:${address.port}/v1`,
    apiKey: 'stub-secret',
  });
  const result = await client.complete(messages, new AbortController().signal);

  assert.equal(result, finalContent);
  assert.equal(received.length, 1);
  assert.ok(received[0].path?.endsWith('/chat/completions'));
  assert.equal(received[0].authorization, 'Bearer stub-secret');
  const body = received[0].body;
  assert.equal(body.model, 'test/model');
  assert.equal(Object.hasOwn(body, 'response_format'), false);
  assert.equal(Object.hasOwn(body, 'tools'), false);
  const sentMessages = body.messages as Array<{ role: string; content: string }>;
  assert.ok(sentMessages.length >= 8, 'system prompt, examples, and the current request are sent');
  assert.ok(sentMessages.every(message => message.content.trim().length > 0));
  assert.ok(sentMessages.some(message => message.content.includes('four weeks')));
  assert.ok(sentMessages.some(message => message.content.includes('لا نعرف الميزانية')));
  assert.deepEqual(body.chat_template_kwargs, { enable_thinking: false });
});

test('repair messages preserve original input and include validation feedback', () => {
  const requestWithAnswer = parseBriefRequest({
    notes: 'A textile shop needs to log seam defects.',
    lang: 'en',
    answers: [{ questionId: 'budget', question: 'What is the budget?', answer: 'It is not decided.' }],
  });
  const messages = buildRepairMessages(requestWithAnswer, 'not JSON', ['draft.titleEn: Required'], context);
  const lastContent = messages.at(-1)?.content;
  assert.equal(typeof lastContent, 'string');
  assert.ok(lastContent.includes('A textile shop needs to log seam defects.'));
  assert.ok(lastContent.includes('It is not decided.'));
  assert.ok(lastContent.includes('not JSON'));
  assert.ok(lastContent.includes('draft.titleEn: Required'));
  assert.ok(messages.length >= 8);
});

test('does not retry transient provider failures inside the SDK', async t => {
  let calls = 0;
  const server = createServer(async (incoming, response) => {
    await readBody(incoming);
    calls += 1;
    response.writeHead(503, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'temporarily unavailable', type: 'server_error' } }));
  });
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const client = createFeatherlessModel({
    baseURL: `http://127.0.0.1:${address.port}/v1`,
    apiKey: 'stub-secret',
  });

  await assert.rejects(client.complete(buildBriefMessages(request, context), new AbortController().signal));
  assert.equal(calls, 1);
});

test('reports a missing API key when invoked, after module import succeeds', async () => {
  const client = createFeatherlessModel({ apiKey: '' });
  await assert.rejects(
    client.complete([], new AbortController().signal),
    AiUnavailableError,
  );
});
