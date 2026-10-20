import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('public statistics count published companies, talent, open future budgets, and selected applicants', async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url && new URL(url).pathname.endsWith('_test'), 'Tests require a separate *_test database');
  process.env.DATABASE_URL = url;
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  const { bootstrap } = require('../dist/main');
  let { app, pool } = await bootstrap(0);
  let base = await app.getUrl();
  const sql = new pg.Client({ connectionString: url });
  await sql.connect();
  const origin = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',')[0];
  const client = () => {
    let cookie = '';
    return async (path: string, method = 'GET', body?: unknown) => {
      const response = await fetch(`${base}/api${path}`, { method, headers: { Origin: origin, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null };
    };
  };
  const company = client(), talent = client(), visitor = client();
  const suffix = randomUUID();
  const password = 'WorkingDemo123!';
  const getStats = async () => {
    const result = await visitor('/public/stats');
    assert.equal(result.status, 200, JSON.stringify(result.data));
    assert.deepEqual(Object.keys(result.data).sort(), ['companiesWithPublishedProblems', 'openBudgetDzd', 'problemsWithSelectedApplicant', 'talentAccounts']);
    for (const value of Object.values(result.data)) assert.equal(typeof value, 'number');
    return result.data as { companiesWithPublishedProblems: number; talentAccounts: number; openBudgetDzd: number; problemsWithSelectedApplicant: number };
  };
  const makeDraft = (title: string, budgetDzd: number) => company('/problems', 'POST', { titleEn: title, summaryEn: 'A practical integration challenge for statistics.', descriptionEn: 'Build and document a reliable monitoring system with clear validation steps.', skills: ['IOT'], budgetDzd, deadlineAt: new Date(Date.now() + 86400000).toISOString(), privateNotes: 'Private statistics test notes.' });
  const publish = (id: string) => company(`/problems/${id}/publish`, 'POST');
  try {
    const before = await getStats();
    assert.equal((await visitor('/notifications')).status, 401);
    for (const [call, name, accountType] of [[company, 'Statistics Company', 'COMPANY'], [talent, 'Statistics Talent', 'TALENT']] as const) {
      const result = await call('/auth/register', 'POST', { email: `${name.toLowerCase().replace(/ /g, '-')}+${suffix}@example.test`, password, name, accountType });
      assert.equal(result.status, 201, JSON.stringify(result.data));
    }
    const profile = await talent('/profiles/me', 'PATCH', { firstName: 'Stats', lastName: 'Talent', educationLevel: 'Student', institutionMajor: 'Software engineering', experienceLevel: 'Student', skills: ['IOT'], githubUrl: 'https://github.com/example' });
    assert.equal(profile.status, 200, JSON.stringify(profile.data));
    const withTalent = await getStats();
    assert.equal(withTalent.talentAccounts, before.talentAccounts + 1);

    const firstDraft = await makeDraft('Statistics published challenge one', 23001);
    assert.equal(firstDraft.status, 201, JSON.stringify(firstDraft.data));
    const draftStats = await getStats();
    assert.equal(draftStats.companiesWithPublishedProblems, before.companiesWithPublishedProblems, 'a draft-only company is not counted');
    assert.equal(draftStats.openBudgetDzd, before.openBudgetDzd, 'draft budgets are excluded');
    assert.equal((await publish(firstDraft.data.id)).status, 201);
    const firstPublished = await getStats();
    assert.equal(firstPublished.companiesWithPublishedProblems, before.companiesWithPublishedProblems + 1);
    assert.equal(firstPublished.openBudgetDzd, before.openBudgetDzd + 23001);

    const secondDraft = await makeDraft('Statistics published challenge two', 31007);
    assert.equal(secondDraft.status, 201, JSON.stringify(secondDraft.data));
    assert.equal((await publish(secondDraft.data.id)).status, 201);
    const twoPublished = await getStats();
    assert.equal(twoPublished.companiesWithPublishedProblems, before.companiesWithPublishedProblems + 1, 'multiple published problems count their company once');
    assert.equal(twoPublished.openBudgetDzd, before.openBudgetDzd + 23001 + 31007);

    await sql.query('UPDATE "Problem" SET "deadlineAt" = now() - interval \'1 day\' WHERE id = $1', [secondDraft.data.id]);
    const pastDeadline = await getStats();
    assert.equal(pastDeadline.openBudgetDzd, before.openBudgetDzd + 23001, 'expired OPEN budgets are excluded');

    const proposal = { coverMessage: 'I can deliver a tested monitoring solution with clear docs and the reliability work needed for success.', deliveryDays: 10, consent: true, projectUrl: 'https://github.com/example/demo' };
    const submitted = await talent(`/problems/${firstDraft.data.id}/applications`, 'POST', proposal);
    assert.equal(submitted.status, 201, JSON.stringify(submitted.data));
    const accepted = await company(`/applications/${submitted.data.id}/decision`, 'POST', { decision: 'ACCEPTED' });
    assert.equal(accepted.status, 201, JSON.stringify(accepted.data));
    const selected = await getStats();
    assert.equal(selected.problemsWithSelectedApplicant, before.problemsWithSelectedApplicant + 1);
    assert.equal(selected.openBudgetDzd, before.openBudgetDzd, 'accepted and closed challenge budget is excluded');

    const noWinnerDraft = await makeDraft('Statistics closed without a selected applicant', 50000);
    assert.equal(noWinnerDraft.status, 201, JSON.stringify(noWinnerDraft.data));
    assert.equal((await publish(noWinnerDraft.data.id)).status, 201);
    const unselectedOpen = await getStats();
    assert.equal(unselectedOpen.problemsWithSelectedApplicant, selected.problemsWithSelectedApplicant, 'open challenges do not imply selection');
    assert.equal((await company(`/problems/${noWinnerDraft.data.id}/close`, 'POST')).status, 201);
    const closedWithoutWinner = await getStats();
    assert.equal(closedWithoutWinner.problemsWithSelectedApplicant, selected.problemsWithSelectedApplicant, 'closing without a winner does not imply selection');
    assert.equal(closedWithoutWinner.openBudgetDzd, selected.openBudgetDzd);

    const json = JSON.stringify(await visitor('/public/stats'));
    assert.ok(!json.match(/email|private|companyUserId|applicantUserId|acceptedApplicationId|items/i));
  } finally {
    await sql.end();
    await app.close(); await pool.end();
  }
});

test('public statistics are all zero in a newly migrated test-owned database', async () => {
  const originalUrl = process.env.TEST_DATABASE_URL;
  assert.ok(originalUrl && new URL(originalUrl).pathname.endsWith('_test'), 'Tests require a separate *_test database');
  const databaseName = `rexios_stats_${randomUUID().replace(/-/g, '')}_test`;
  assert.match(databaseName, /^rexios_stats_[a-f0-9]{32}_test$/);
  const admin = new pg.Client({ connectionString: originalUrl });
  await admin.connect();
  let created = false;
  let app: any;
  let pool: any;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
    const isolated = new URL(originalUrl);
    isolated.pathname = `/${databaseName}`;
    const isolatedUrl = isolated.toString();
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: { ...process.env, DATABASE_URL: isolatedUrl }, stdio: 'pipe' });
    process.env.DATABASE_URL = isolatedUrl;
    const { bootstrap } = require('../dist/main');
    ({ app, pool } = await bootstrap(0));
    const response = await fetch(`${await app.getUrl()}/api/public/stats`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { companiesWithPublishedProblems: 0, talentAccounts: 0, openBudgetDzd: 0, problemsWithSelectedApplicant: 0 });
  } finally {
    if (app) await app.close();
    if (pool) await pool.end();
    process.env.DATABASE_URL = previousDatabaseUrl;
    if (created && /^rexios_stats_[a-f0-9]{32}_test$/.test(databaseName)) await admin.query(`DROP DATABASE "${databaseName}"`);
    await admin.end();
  }
});
