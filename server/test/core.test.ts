import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

test('core HTTP workflow enforces account ownership and decision state', async t => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url && new URL(url).pathname.endsWith('_test'), 'Tests require a separate *_test database');
  process.env.DATABASE_URL = url;
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  const { bootstrap } = require('../dist/main');
  let { app, pool } = await bootstrap(0);
  let base = await app.getUrl();
  const origin = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',')[0];
  const client = () => {
    let cookie = '';
    return async (path: string, method = 'GET', body?: unknown) => {
      const multipart = body instanceof FormData;
      const response = await fetch(`${base}/api${path}`, { method, headers: { Origin: origin, ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer()) };
    };
  };
  const company = client(), outsiderCompany = client(), talent = client(), other = client(), visitor = client();
  const suffix = randomUUID();
  const password = 'WorkingDemo123!';
  let companyId = '', problemId = '', applicationId = '';
  let privateFileId = '', applicationFileId = '';
  const upload = (purpose: string, parent: Record<string, string>, content = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n') => {
    const form = new FormData();
    form.set('purpose', purpose);
    for (const [key, value] of Object.entries(parent)) form.set(key, value);
    form.set('file', new Blob([content], { type: 'application/pdf' }), 'proposal.pdf');
    return form;
  };
  try {
    await t.test('auth rejects invalid credentials and sessions survive requests', async () => {
      for (const [call, kind, name] of [[company, 'COMPANY', 'Company'], [outsiderCompany, 'COMPANY', 'Other company'], [talent, 'TALENT', 'Applicant'], [other, 'TALENT', 'Other applicant']] as const) {
        const response = await call('/auth/register', 'POST', { email: `${name.replace(/ /g, '-')}+${suffix}@example.test`, password, name, accountType: kind });
        assert.equal(response.status, 201, JSON.stringify(response.data));
        assert.ok(!JSON.stringify(response.data).includes('passwordHash'));
        if (call === company) companyId = response.data.id;
      }
      assert.equal((await company('/auth/me')).status, 200);
      assert.equal((await visitor('/auth/login', 'POST', { email: `Company+${suffix}@example.test`, password: 'wrong' })).status, 401);
      assert.equal((await visitor('/auth/register', 'POST', { email: `Company+${suffix}@example.test`, password, name: 'Duplicate', accountType: 'COMPANY' })).status, 409);
      assert.equal((await talent('/profiles/me', 'PATCH', { role: 'COMPANY' })).status, 400);
    });
    await t.test('company publishes; drafts and private data are never public', async () => {
      const draft = await company('/problems', 'POST', { titleEn: 'Industrial temperature monitoring demo', summaryEn: 'A practical temperature monitoring challenge.', descriptionEn: 'Build a documented local temperature monitoring system with reliable offline alerts.', skills: ['PYTHON'], budgetDzd: 45000, deadlineAt: new Date(Date.now() + 86400000).toISOString(), privateNotes: 'Confidential sample production information.' });
      assert.equal(draft.status, 201, JSON.stringify(draft.data)); problemId = draft.data.id;
      assert.equal((await visitor(`/problems/${problemId}`)).status, 404);
      assert.equal((await outsiderCompany(`/company/problems/${problemId}`)).status, 404);
      assert.equal((await talent(`/problems/${problemId}`, 'PATCH', { titleEn: 'Unauthorized edit' })).status, 403);
      assert.equal((await company(`/problems/${problemId}/publish`, 'POST')).status, 201);
      const publicResult = await visitor(`/problems/${problemId}`);
      assert.equal(publicResult.status, 200);
      assert.equal(publicResult.data.title, publicResult.data.title_en);
      assert.ok(!JSON.stringify(publicResult.data).includes('Confidential'));
      assert.equal((await talent(`/problems/${problemId}/private`)).status, 404);
      assert.equal((await visitor('/problems?q=temperature&skill=PYTHON&difficulty=medium&minReward=40000')).data.items.some((p: any) => p.id === problemId), true);
      assert.equal((await visitor('/problems?limit=1000')).status, 400);
    });
    await t.test('private problem files require owner access and reject fake PDFs', async () => {
      const result = await company('/files', 'POST', upload('PROBLEM_PRIVATE', { problemId }));
      assert.equal(result.status, 201, JSON.stringify(result.data)); privateFileId = result.data.id;
      const download = await company(`/files/${privateFileId}`);
      assert.equal(download.status, 200); assert.ok(download.data.toString().startsWith('%PDF-'));
      assert.equal((await talent(`/files/${privateFileId}`)).status, 404);
      assert.equal((await outsiderCompany(`/files/${privateFileId}`)).status, 404);
      assert.equal((await company('/files', 'POST', upload('PROBLEM_PUBLIC', { problemId }, '<script>not a PDF</script>'))).status, 400);
      assert.equal((await company('/files', 'POST', upload('PROBLEM_PUBLIC', { problemId }, ''))).status, 400);
      assert.equal((await company('/files', 'POST', upload('PROBLEM_PUBLIC', { problemId }, '%PDF-' + 'x'.repeat(5 * 1024 * 1024)))).status, 413);
    });
    await t.test('drafts are private and duplicate submission creates one application', async () => {
      for (const call of [talent, other]) {
        const profile = await call('/profiles/me', 'PATCH', { firstName: 'Demo', lastName: 'Engineer', educationLevel: 'Student', institutionMajor: 'Software engineering', experienceLevel: 'Student', skills: ['PYTHON'], githubUrl: 'https://github.com/example' });
        assert.equal(profile.status, 200, JSON.stringify(profile.data));
        assert.equal(profile.data.solverProfile.completenessPercent, 100);
      }
      const proposal = { coverMessage: 'I will build a practical monitored solution with documentation and a clear delivery plan.', deliveryDays: 10, consent: true, projectUrl: 'https://github.com/example/demo' };
      assert.equal((await talent(`/problems/${problemId}/application/draft`, 'PUT', proposal)).status, 200);
      const draft = (await talent('/me/applications')).data.items.find((item: any) => item.problemId === problemId);
      const file = await talent('/files', 'POST', upload('APPLICATION', { applicationId: draft.id }));
      assert.equal(file.status, 201, JSON.stringify(file.data)); applicationFileId = file.data.id;
      assert.equal((await company(`/files/${applicationFileId}`)).status, 404);
      assert.equal((await company(`/company/problems/${problemId}/applications`)).data.total, 0);
      const results = await Promise.all([talent(`/problems/${problemId}/applications`, 'POST', proposal), talent(`/problems/${problemId}/applications`, 'POST', proposal)]);
      assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
      applicationId = results.find(r => r.status === 201)!.data.id;
      assert.equal((await company(`/files/${applicationFileId}`)).status, 200);
      assert.equal((await other(`/files/${applicationFileId}`)).status, 404);
      assert.equal((await other(`/problems/${problemId}/applications`, 'POST', proposal)).status, 201);
      assert.equal((await outsiderCompany(`/company/problems/${problemId}/applications`)).status, 404);
      assert.equal((await company(`/problems/${problemId}`, 'PATCH', { budgetDzd: 1 })).status, 409);
      const privateEdit = await company(`/problems/${problemId}`, 'PATCH', { privateNotes: 'Updated confidential notes after receiving applications.' });
      assert.equal(privateEdit.status, 200, JSON.stringify(privateEdit.data));
      assert.equal((await company(`/problems/${problemId}/private`)).data.notes, 'Updated confidential notes after receiving applications.');
    });
    await t.test('one company decision wins concurrently and dashboards agree', async () => {
      const list = await company(`/company/problems/${problemId}/applications`);
      assert.equal(list.data.total, 2);
      const second = list.data.items.find((item: any) => item.id !== applicationId);
      const decisions = await Promise.all([company(`/applications/${applicationId}/decision`, 'POST', { decision: 'ACCEPTED' }), company(`/applications/${second.id}/decision`, 'POST', { decision: 'ACCEPTED' })]);
      assert.deepEqual(decisions.map(r => r.status).sort(), [201, 409]);
      const final = await company(`/company/problems/${problemId}/applications`);
      assert.equal(final.data.items.filter((a: any) => a.status === 'ACCEPTED').length, 1);
      assert.equal(final.data.items.filter((a: any) => a.status === 'REJECTED').length, 1);
      assert.equal((await visitor(`/problems/${problemId}`)).data.status, 'CLOSED');
      const mine = (await talent('/me/applications')).data.items.find((a: any) => a.problemId === problemId);
      assert.ok(mine.problem.title, 'English-only content has a fallback title in Arabic views');
      assert.ok(['ACCEPTED', 'REJECTED'].includes(mine.status));
      assert.equal((await talent(`/problems/${problemId}/private`)).status, mine.status === 'ACCEPTED' ? 200 : 404);
      assert.equal((await talent(`/files/${privateFileId}`)).status, mine.status === 'ACCEPTED' ? 200 : 404);
      assert.equal((await visitor(`/problems/${problemId}/private`)).status, 401);
      assert.equal((await company(`/problems/${problemId}`, 'PATCH', { privateNotes: '' })).status, 200);
      assert.equal((await company(`/problems/${problemId}/private`)).data.notes, '');
    });
    await t.test('discussion belongs to one problem and logout removes identity', async () => {
      const comment = await talent(`/problems/${problemId}/comments`, 'POST', { body: 'Can you clarify the sensor requirements?' });
      assert.equal(comment.status, 201);
      assert.equal((await visitor(`/problems/${problemId}/comments`)).data.items.length, 1);
      assert.equal((await visitor(`/problems/${problemId}/comments`, 'POST', { body: 'Anonymous comment' })).status, 401);
      assert.equal((await talent('/auth/logout', 'POST')).status, 200);
      assert.equal((await talent('/auth/me')).status, 401);
    });
    await t.test('sessions and recorded decisions survive an API restart', async () => {
      await app.close(); await pool.end();
      ({ app, pool } = await bootstrap(0));
      base = await app.getUrl();
      assert.equal((await company('/auth/me')).data.id, companyId);
      assert.equal((await company(`/company/problems/${problemId}/applications`)).data.items.filter((a: any) => a.status === 'ACCEPTED').length, 1);
    });
  } finally { await app.close(); await pool.end(); }
  assert.ok(companyId);
});
