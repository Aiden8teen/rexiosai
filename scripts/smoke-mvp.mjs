import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const origin = process.env.SMOKE_ORIGIN || new URL(base).origin;
const marker = randomUUID().slice(0, 8);
function client() {
  let cookie = '';
  return async (path, method = 'GET', body, expected = 200) => {
    const multipart = body instanceof FormData;
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const payload = response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(payload)}`);
    return payload;
  };
}

const company = client(), talent = client(), visitor = client();
const account = (name, accountType) => ({ name: `Smoke ${name}`, email: `smoke-${name}-${marker}@demo.test`, password: 'SmokeDemo123!', accountType });
await company('/auth/register', 'POST', account('company', 'COMPANY'), 201);
await talent('/auth/register', 'POST', account('talent', 'TALENT'), 201);
await talent('/profiles/me', 'PATCH', { firstName: 'Demo', lastName: 'Engineer', educationLevel: 'Student', institutionMajor: 'Software engineering', experienceLevel: 'Student', skills: ['PYTHON'], githubUrl: 'https://github.com/example' });
const problem = await company('/problems', 'POST', { titleEn: `Smoke check: monitoring ${marker}`, summaryEn: 'A synthetic problem used to verify the working demo.', descriptionEn: 'Create an offline temperature monitoring prototype with reliable alerts and clear documentation.', skills: ['PYTHON'], category: 'CHALLENGE', budgetDzd: 10000, deadlineAt: new Date(Date.now() + 7 * 86400000).toISOString(), privateNotes: `Private smoke notes ${marker}` }, 201);
await visitor(`/problems/${problem.id}`, 'GET', undefined, 404);
await company(`/problems/${problem.id}/publish`, 'POST', undefined, 201);
const publicProblem = await visitor(`/problems/${problem.id}`);
assert.ok(!JSON.stringify(publicProblem).includes('Private smoke notes'));
await talent(`/problems/${problem.id}/private`, 'GET', undefined, 404);
await talent(`/problems/${problem.id}/comments`, 'POST', { body: 'This comment verifies persisted discussion during a local demo check.' }, 201);
const proposal = { coverMessage: 'I will implement a documented prototype with reliable local monitoring and a clear delivery plan.', deliveryDays: 10, consent: true };
await talent(`/problems/${problem.id}/application/draft`, 'PUT', proposal);
assert.equal((await company(`/company/problems/${problem.id}/applications`)).total, 0);
const application = await talent(`/problems/${problem.id}/applications`, 'POST', proposal, 201);
await company(`/problems/${problem.id}`, 'PATCH', { privateNotes: `Private smoke notes ${marker}: updated` });
await company(`/applications/${application.id}/decision`, 'POST', { decision: 'ACCEPTED' }, 201);
assert.equal((await visitor(`/problems/${problem.id}`)).status, 'CLOSED');
assert.equal((await talent(`/problems/${problem.id}/private`)).notes, `Private smoke notes ${marker}: updated`);
assert.equal((await talent('/me/applications')).items.find(item => item.id === application.id).status, 'ACCEPTED');
await talent('/auth/logout', 'POST');
await talent('/auth/me', 'GET', undefined, 401);
console.log(`MVP smoke passed at ${base}; synthetic closed problem ${problem.id} retained. No existing records were reset.`);
