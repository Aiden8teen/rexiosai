import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { PrismaService } from '../src/database/prisma.service';

const validDraft = {
  title: 'سجل عيوب الخياطة',
  titleEn: 'Stitching defect log',
  summary: 'سجّل عيوب الخياطة يوميًا.',
  summaryEn: 'Record stitching defects each day.',
  description: 'أنشئ مسارًا بسيطًا لتسجيل العيوب ومراجعة أعدادها اليومية.',
  descriptionEn: 'Create a simple workflow to record defects and review daily counts.',
  deliverables: ['نموذج لتسجيل نوع العيب والتاريخ.'],
  deliverablesEn: ['A form to record defect type and date.'],
  constraints: [],
  constraintsEn: [],
  criteria: ['يظهر عدد العيوب المسجلة لكل يوم.'],
  criteriaEn: ['The recorded defect count is shown for each day.'],
  skills: ['PYTHON'],
  category: 'CHALLENGE',
  difficulty: 'medium',
  budgetDzd: null,
  applicationDeadlineDate: null,
};

const draftResponse = JSON.stringify({
  status: 'draft', draft: validDraft, fieldSources: { skills: 'suggested' }, questions: [], warnings: [],
});
const needsContextResponse = JSON.stringify({
  status: 'needs_context', draft: null, fieldSources: {},
  questions: [{ id: 'problem', field: 'context', text: { ar: 'ما المشكلة الصناعية التي تريدون حلها؟', en: 'What industrial problem would you like to solve?' } }],
  warnings: [],
});

type InferenceReply = { status?: number; content?: string; delayMs?: number; message?: string };

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function restoreEnv(previous: Map<string, string | undefined>): void {
  for (const [name, value] of previous) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

test('challenge brief endpoint enforces session, validates output, and never writes generated drafts', async t => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl && new URL(databaseUrl).pathname.endsWith('_test'), 'AI API tests require a separate *_test database');

  const envNames = [
    'DATABASE_URL', 'NODE_ENV', 'FEATHERLESS_API_KEY', 'FEATHERLESS_BASE_URL', 'FEATHERLESS_MODEL',
    'AI_REQUEST_TIMEOUT_MS', 'AI_MAX_OUTPUT_TOKENS', 'AI_MAX_REPAIR_ATTEMPTS',
  ];
  const previousEnv = new Map(envNames.map(name => [name, process.env[name]]));
  const replies: InferenceReply[] = [];
  const received: Array<{ authorization: string | undefined; path: string | undefined; body: Record<string, unknown> }> = [];
  const inference = createServer(async (request, response) => {
    const body = JSON.parse(await readBody(request)) as Record<string, unknown>;
    received.push({ authorization: request.headers.authorization, path: request.url, body });
    const reply = replies.shift();
    if (!reply) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { message: 'No local test inference reply was queued.' } }));
      return;
    }
    if (reply.delayMs) await new Promise(resolve => setTimeout(resolve, reply.delayMs));
    if (request.aborted || response.destroyed) return;
    if (reply.status && reply.status !== 200) {
      response.writeHead(reply.status, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { message: reply.message || 'sensitive upstream diagnostic should not leak', type: 'server_error' } }));
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      id: 'chatcmpl-local-test', object: 'chat.completion', created: 1, model: 'test/model',
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: reply.content } }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    }));
  });

  let app: any;
  let sessionPool: any;
  try {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = databaseUrl;
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });

    inference.listen(0, '127.0.0.1');
    await once(inference, 'listening');
    const inferenceAddress = inference.address() as AddressInfo;
    process.env.FEATHERLESS_API_KEY = 'local-test-only-key';
    process.env.FEATHERLESS_BASE_URL = `http://127.0.0.1:${inferenceAddress.port}/v1`;
    process.env.FEATHERLESS_MODEL = 'test/model';
    process.env.AI_REQUEST_TIMEOUT_MS = '3000';
    process.env.AI_MAX_REPAIR_ATTEMPTS = '2';

    const { bootstrap } = require('../dist/main');
    ({ app, pool: sessionPool } = await bootstrap(0));
    let base = await app.getUrl();
    const origin = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',')[0];
    const client = () => {
      let cookie = '';
      return async (path: string, method = 'GET', body?: unknown) => {
        const response = await fetch(`${base}/api${path}`, {
          method,
          headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];
        return { status: response.status, data: await response.json() };
      };
    };
    const company = client(), talent = client(), visitor = client();
    const suffix = randomUUID();
    const password = 'BriefTest123!';
    assert.equal((await company('/auth/register', 'POST', { name: 'Brief API Company', email: `brief-company-${suffix}@example.test`, password, accountType: 'COMPANY' })).status, 201);
    assert.equal((await talent('/auth/register', 'POST', { name: 'Brief API Talent', email: `brief-talent-${suffix}@example.test`, password, accountType: 'TALENT' })).status, 201);

    const { PrismaService: CompiledPrismaService } = require('../dist/database/prisma.service');
    const db = app.get(CompiledPrismaService) as PrismaService;
    const beforeProblems = await db.problem.findMany({ orderBy: { id: 'asc' } });
    const beforeCompanyProfiles = await db.companyProfile.findMany({ orderBy: { userId: 'asc' } });
    const route = '/ai/challenge-brief';
    const basicRequest = { notes: 'A textile workshop wants to record stitching defects.', lang: 'en' };

    await t.test('requires a session and company account', async () => {
      assert.equal((await visitor(route, 'POST', basicRequest)).status, 401);
      assert.equal((await talent(route, 'POST', basicRequest)).status, 403);
    });

    await t.test('rejects blank notes before contacting inference', async () => {
      const calls = received.length;
      const result = await company(route, 'POST', { notes: '   ', lang: 'en' });
      assert.equal(result.status, 400);
      assert.equal(received.length, calls);
    });

    await t.test('returns a usable draft and supports refinement and needs-context', async () => {
      replies.push({ content: draftResponse }, { content: draftResponse }, { content: needsContextResponse });
      const generated = await company(route, 'POST', basicRequest);
      assert.equal(generated.status, 200, JSON.stringify(generated.data));
      assert.equal(generated.data.status, 'draft');
      assert.equal(generated.data.draft.titleEn, 'Stitching defect log');

      const refined = await company(route, 'POST', {
        ...basicRequest,
        notes: 'A textile workshop now records stitching defects in a shared spreadsheet.',
        previousDraft: validDraft,
        answers: [{ questionId: 'workflow', question: 'Where are defects recorded?', answer: 'In a shared spreadsheet.' }],
        instructions: 'Keep the first draft and clarify the current spreadsheet workflow.',
      });
      assert.equal(refined.status, 200, JSON.stringify(refined.data));
      assert.equal(refined.data.status, 'draft');

      const needsContext = await company(route, 'POST', { notes: 'Hello, can you help?', lang: 'en' });
      assert.equal(needsContext.status, 200, JSON.stringify(needsContext.data));
      assert.equal(needsContext.data.status, 'needs_context');
      assert.equal(needsContext.data.draft, null);
      assert.ok(needsContext.data.questions.length > 0);
    });

    await t.test('accepts an ordinary large bilingual draft below the 1 MiB parser limit', async () => {
      const longArabic = 'توضيح تفاصيل سير العمل الصناعي والمخرجات المطلوبة مع الحفاظ على سلامة المعلومات المقدمة. '.repeat(105);
      const longEnglish = 'Describe the industrial workflow and expected deliverables while preserving the supplied facts. '.repeat(105);
      const longItemAr = ('متطلب واضح ومحدد مرتبط بسير العمل الحالي. ').repeat(18);
      const longItemEn = ('A clear requirement tied to the current workflow. ').repeat(18);
      const list = (item: string) => Array.from({ length: 18 }, () => item);
      const previousDraft = {
        ...validDraft,
        description: longArabic,
        descriptionEn: longEnglish,
        deliverables: list(longItemAr),
        deliverablesEn: list(longItemEn),
        constraints: list(longItemAr),
        constraintsEn: list(longItemEn),
        criteria: list(longItemAr),
        criteriaEn: list(longItemEn),
      };
      const payload = { ...basicRequest, previousDraft, instructions: 'Keep the bilingual details while clarifying the pilot scope.' };
      const byteLength = Buffer.byteLength(JSON.stringify(payload));
      assert.ok(byteLength > 100 * 1024, `expected over 100 KiB, received ${byteLength}`);
      assert.ok(byteLength < 1024 * 1024, `expected under 1 MiB, received ${byteLength}`);
      replies.push({ content: draftResponse });
      const response = await company(route, 'POST', payload);
      assert.equal(response.status, 200, JSON.stringify(response.data));
      assert.equal(response.data.status, 'draft');
    });

    await t.test('returns 422 after the configured schema repair attempts are exhausted', async () => {
      replies.push({ content: 'invalid output one' }, { content: 'invalid output two' }, { content: 'invalid output three' });
      const response = await company(route, 'POST', basicRequest);
      assert.equal(response.status, 422, JSON.stringify(response.data));
      assert.ok(!JSON.stringify(response.data).includes('invalid output'));
    });

    await t.test('returns a localized configuration error without invoking the provider when no key is configured', async () => {
      process.env.FEATHERLESS_API_KEY = '';
      const calls = received.length;
      const response = await company(route, 'POST', basicRequest);
      assert.equal(response.status, 503, JSON.stringify(response.data));
      assert.ok(/configure|available|إعداد|متاح/i.test(response.data.message));
      assert.equal(received.length, calls);
      process.env.FEATHERLESS_API_KEY = 'local-test-only-key';
    });

    await t.test('maps graph timeout to 504', async () => {
      process.env.AI_REQUEST_TIMEOUT_MS = '80';
      replies.push({ content: draftResponse, delayMs: 500 });
      const response = await company(route, 'POST', basicRequest);
      assert.equal(response.status, 504, JSON.stringify(response.data));
      process.env.AI_REQUEST_TIMEOUT_MS = '3000';
    });

    await t.test('hides a non-capacity upstream error behind 502', async () => {
      replies.push({ status: 500 });
      const response = await company(route, 'POST', basicRequest);
      const serialized = JSON.stringify(response.data);
      assert.equal(response.status, 502, serialized);
      assert.ok(!serialized.includes('sensitive upstream diagnostic'));
      assert.ok(!serialized.includes('local-test-only-key'));
    });

    await t.test('maps provider capacity responses to retryable 503', async () => {
      replies.push({ status: 429 });
      const response = await company(route, 'POST', basicRequest);
      assert.equal(response.status, 503, JSON.stringify(response.data));
      assert.match(response.data.message, /retry|try again/i);
      assert.ok(!JSON.stringify(response.data).includes('sensitive upstream diagnostic'));
    });

    await t.test('maps temporary provider capacity to a localized retryable 503', async () => {
      replies.push({ status: 500, message: 'Temporary capacity is unavailable.' });
      const response = await company(route, 'POST', { ...basicRequest, lang: 'ar' });
      assert.equal(response.status, 503, JSON.stringify(response.data));
      assert.match(response.data.message, /إعادة المحاولة/);
      assert.ok(!JSON.stringify(response.data).includes('Temporary capacity'));
    });

    await t.test('honors six configured repair attempts before returning a valid draft', async () => {
      process.env.AI_MAX_REPAIR_ATTEMPTS = '6';
      const callsBefore = received.length;
      replies.push(...Array.from({ length: 6 }, (_, index) => ({ content: `malformed response ${index + 1}` })), { content: draftResponse });
      const response = await (async () => {
        try { return await company(route, 'POST', basicRequest); }
        finally { process.env.AI_MAX_REPAIR_ATTEMPTS = '2'; }
      })();
      assert.equal(response.status, 200, JSON.stringify(response.data));
      assert.equal(response.data.status, 'draft');
      assert.equal(received.length - callsBefore, 7);
    });

    await t.test('sends only the configured local inference key to the local stub', async () => {
      assert.ok(received.length > 0);
      assert.ok(received.every(request => request.path?.endsWith('/chat/completions')));
      assert.ok(received.every(request => request.authorization === 'Bearer local-test-only-key'));
      assert.ok(received.every(request => JSON.stringify(request.body).includes('test/model')));
    });

    await t.test('generation leaves Problem and CompanyProfile records unchanged', async () => {
      assert.deepEqual(await db.problem.findMany({ orderBy: { id: 'asc' } }), beforeProblems);
      assert.deepEqual(await db.companyProfile.findMany({ orderBy: { userId: 'asc' } }), beforeCompanyProfiles);
    });

    await app.close();
    await sessionPool.end();
    app = undefined;
    sessionPool = undefined;
    ({ app, pool: sessionPool } = await bootstrap(0));
    base = await app.getUrl();
    await t.test('compiled API starts against the local test database and health remains available', async () => {
      const response = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: 'ok' });
    });
  } finally {
    if (app) await app.close();
    if (sessionPool) await sessionPool.end();
    await closeServer(inference);
    restoreEnv(previousEnv);
  }
});
