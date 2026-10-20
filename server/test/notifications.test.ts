import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

test('notifications persist domain events, stay recipient-scoped, and omit private payloads', async () => {
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
      const response = await fetch(`${base}/api${path}`, { method, headers: { Origin: origin, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return { status: response.status, cacheControl: response.headers.get('cache-control'), data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null };
    };
  };
  const company = client(), outsider = client(), talentA = client(), talentB = client(), talentC = client(), visitor = client();
  const suffix = randomUUID();
  const password = 'WorkingDemo123!';
  const register = async (call: ReturnType<typeof client>, name: string, accountType: 'COMPANY' | 'TALENT') => call('/auth/register', 'POST', { email: `${name.toLowerCase().replace(/ /g, '-')}+${suffix}@example.test`, password, name, accountType });
  const completeTalent = async (call: ReturnType<typeof client>) => call('/profiles/me', 'PATCH', { firstName: 'Demo', lastName: 'Engineer', educationLevel: 'Student', institutionMajor: 'Software engineering', experienceLevel: 'Student', skills: ['IOT'], githubUrl: 'https://github.com/example' });
  const notificationList = async (call: ReturnType<typeof client>) => call('/notifications');
  try {
    for (const [call, name, type] of [[company, 'Notify Company', 'COMPANY'], [outsider, 'Other Company', 'COMPANY'], [talentA, 'Applicant A', 'TALENT'], [talentB, 'Applicant B', 'TALENT'], [talentC, 'Applicant C', 'TALENT']] as const) {
      const result = await register(call, name, type);
      assert.equal(result.status, 201, JSON.stringify(result.data));
    }
    await Promise.all([completeTalent(talentA), completeTalent(talentB), completeTalent(talentC)]);

    assert.equal((await notificationList(visitor)).status, 401);
    assert.equal((await notificationList(outsider)).data.unreadCount, 0);

    const question = await talentA('/community/questions', 'POST', { language: 'en', title: 'How can I diagnose an unstable sensor?', body: 'I am building an embedded sensor monitor and need a reliable way to find intermittent readings.', tags: ['IOT'] });
    assert.equal(question.status, 201, JSON.stringify(question.data));
    const answer = await talentB(`/community/questions/${question.data.id}/answers`, 'POST', { language: 'en', body: 'Log the raw samples with timestamps and compare them against a known reference sensor.' });
    assert.equal(answer.status, 201, JSON.stringify(answer.data));

    let ownerFeed = await notificationList(talentA);
    assert.equal(ownerFeed.status, 200);
    assert.equal(ownerFeed.cacheControl, 'private, no-store');
    assert.equal(ownerFeed.data.unreadCount, 1);
    assert.equal(ownerFeed.data.items[0].type, 'COMMUNITY_ANSWER');
    assert.equal(ownerFeed.data.items[0].href, `/community/${question.data.id}`);
    assert.deepEqual(Object.keys(ownerFeed.data.items[0]).sort(), ['createdAt', 'href', 'id', 'readAt', 'title', 'titleEn', 'type']);

    const accepted = await talentA(`/community/questions/${question.data.id}/accepted-answer`, 'PUT', { answerId: answer.data.id });
    assert.equal(accepted.status, 200, JSON.stringify(accepted.data));
    const acceptedAgain = await talentA(`/community/questions/${question.data.id}/accepted-answer`, 'PUT', { answerId: answer.data.id });
    assert.equal(acceptedAgain.status, 200);
    const answerFeed = await notificationList(talentB);
    assert.equal(answerFeed.data.unreadCount, 1, 'selecting the same answer again must not duplicate its event');
    assert.equal(answerFeed.data.items[0].type, 'ANSWER_ACCEPTED');
    assert.equal(answerFeed.data.items[0].href, `/community/${question.data.id}`);

    const selfQuestion = await talentC('/community/questions', 'POST', { language: 'en', title: 'Can I answer my own debugging question?', body: 'I am documenting how I diagnose a flaky sensor and want to keep the notes organized.', tags: ['IOT'] });
    assert.equal(selfQuestion.status, 201, JSON.stringify(selfQuestion.data));
    const selfAnswer = await talentC(`/community/questions/${selfQuestion.data.id}/answers`, 'POST', { language: 'en', body: 'Record timestamped raw readings and compare them against a known reference sensor.' });
    assert.equal(selfAnswer.status, 201, JSON.stringify(selfAnswer.data));
    assert.equal((await notificationList(talentC)).data.items.filter((entry: any) => entry.type === 'COMMUNITY_ANSWER').length, 0, 'answering your own question creates no self-notification');

    const problem = await company('/problems', 'POST', { titleEn: 'Sensor monitoring integration challenge', summaryEn: 'Build a stable sensor monitoring demonstration.', descriptionEn: 'Create and document a reliable local sensor monitoring system with clear test results.', skills: ['IOT'], budgetDzd: 45000, deadlineAt: new Date(Date.now() + 86400000).toISOString(), privateNotes: 'Confidential purchasing notes.' });
    assert.equal(problem.status, 201, JSON.stringify(problem.data));
    assert.equal((await company(`/problems/${problem.data.id}/publish`, 'POST')).status, 201);
    const proposal = (email: string) => ({ coverMessage: `I can deliver a tested sensor solution with documentation and a clear implementation plan for ${email}.`, deliveryDays: 10, consent: true, projectUrl: 'https://github.com/example/demo' });
    const appA = await talentA(`/problems/${problem.data.id}/applications`, 'POST', proposal('a'));
    const appB = await talentB(`/problems/${problem.data.id}/applications`, 'POST', proposal('b'));
    const appC = await talentC(`/problems/${problem.data.id}/applications`, 'POST', proposal('c'));
    for (const result of [appA, appB, appC]) assert.equal(result.status, 201, JSON.stringify(result.data));
    assert.equal((await talentA(`/problems/${problem.data.id}/applications`, 'POST', proposal('a-again'))).status, 409);

    let companyFeed = await notificationList(company);
    assert.equal(companyFeed.status, 200);
    assert.equal(companyFeed.cacheControl, 'private, no-store');
    assert.equal(companyFeed.data.unreadCount, 3);
    assert.equal(companyFeed.data.total, 3);
    assert.ok(companyFeed.data.items.every((entry: any) => entry.type === 'APPLICATION_RECEIVED' && entry.href === `/company/problems/${problem.data.id}/applications`));
    assert.ok(!JSON.stringify(companyFeed.data).match(/coverMessage|rejectionReason|privateNotes|contactEmail|email|files/i));
    assert.deepEqual(Object.keys(companyFeed.data.items[0]).sort(), ['createdAt', 'href', 'id', 'readAt', 'title', 'titleEn', 'type']);

    const privateRead = await outsider(`/notifications/${companyFeed.data.items[0].id}/read`, 'PATCH');
    assert.equal(privateRead.status, 404, 'a different recipient cannot mark this notification read');
    const readOnce = await company(`/notifications/${companyFeed.data.items[0].id}/read`, 'PATCH');
    assert.equal(readOnce.status, 200);
    const readAgain = await company(`/notifications/${companyFeed.data.items[0].id}/read`, 'PATCH');
    assert.equal(readAgain.data.readAt, readOnce.data.readAt, 'repeated reads preserve the original read timestamp');
    assert.equal((await notificationList(company)).data.unreadCount, 2, 'unread count decreases once after a successful read');
    assert.equal((await company('/notifications?limit=51')).status, 400);
    const firstPage = await company('/notifications?limit=1&page=1');
    assert.equal(firstPage.data.items.length, 1);
    assert.equal(firstPage.data.total, 3);

    const decisionsBeforeReject = (await notificationList(talentA)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length;
    const manualReject = await company(`/applications/${appA.data.id}/decision`, 'POST', { decision: 'REJECTED', reason: 'Private rejection explanation.' });
    assert.equal(manualReject.status, 201, JSON.stringify(manualReject.data));
    assert.equal((await notificationList(talentA)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, decisionsBeforeReject + 1);
    const duplicateDecision = await company(`/applications/${appA.data.id}/decision`, 'POST', { decision: 'REJECTED', reason: 'Changed private explanation.' });
    assert.equal(duplicateDecision.status, 409);
    assert.equal((await notificationList(talentA)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, decisionsBeforeReject + 1, 'a rejected repeat decision creates no extra event');
    const rootComment = await talentB(`/problems/${problem.data.id}/comments`, 'POST', { body: 'Could you clarify the sensor calibration requirements?' });
    assert.equal(rootComment.status, 201, JSON.stringify(rootComment.data));
    const reply = await talentC(`/problems/${problem.data.id}/comments`, 'POST', { body: 'I would include a calibration record.', parentId: rootComment.data.id });
    assert.equal(reply.status, 201, JSON.stringify(reply.data));
    assert.equal((await company(`/problems/${problem.data.id}/comments`, 'POST', { body: 'Company response on its own problem.' })).status, 201);
    assert.equal((await notificationList(company)).data.items.filter((entry: any) => entry.type === 'PROBLEM_COMMENT').length, 1, 'root comments notify the company while self-comments do not');
    const rootAuthorFeed = await notificationList(talentB);
    assert.equal(rootAuthorFeed.data.items.filter((entry: any) => entry.type === 'PROBLEM_COMMENT').length, 1, 'replies notify the parent-comment author');
    assert.equal(rootAuthorFeed.data.items.find((entry: any) => entry.type === 'PROBLEM_COMMENT').href, `/problems/${problem.data.id}`);

    const acceptedApp = await company(`/applications/${appB.data.id}/decision`, 'POST', { decision: 'ACCEPTED' });
    assert.equal(acceptedApp.status, 201, JSON.stringify(acceptedApp.data));
    assert.equal((await company(`/applications/${appC.data.id}/decision`, 'POST', { decision: 'REJECTED' })).status, 409, 'automatic rejection makes later decisions conflict');
    assert.equal((await talentC(`/applications/${appC.data.id}/decision`, 'POST', { decision: 'REJECTED' })).status, 403, 'talent accounts cannot make company decisions');
    const feedA = await notificationList(talentA);
    const feedB = await notificationList(talentB);
    const feedC = await notificationList(talentC);
    for (const feed of [feedA, feedB, feedC]) assert.ok(feed.data.items.some((entry: any) => entry.type === 'APPLICATION_DECIDED'));
    assert.ok(!JSON.stringify(feedA.data).includes('Private rejection explanation.'));
    assert.ok(!JSON.stringify(feedA.data).match(/coverMessage|rejectionReason|privateNotes|contactEmail|files/i));
    assert.equal(feedC.data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, 1, 'acceptance notifies every pending applicant rejected automatically');

    const closeProblem = await company('/problems', 'POST', { titleEn: 'Manual closure notification challenge', summaryEn: 'A separate open challenge for closure notification coverage.', descriptionEn: 'Build and document a reliable test system with clear validation and useful monitoring.', skills: ['IOT'], budgetDzd: 12000, deadlineAt: new Date(Date.now() + 86400000).toISOString() });
    assert.equal(closeProblem.status, 201, JSON.stringify(closeProblem.data));
    assert.equal((await company(`/problems/${closeProblem.data.id}/publish`, 'POST')).status, 201);
    assert.equal((await talentC(`/problems/${closeProblem.data.id}/application/draft`, 'PUT', proposal('draft-only'))).status, 200);
    const closeAppA = await talentA(`/problems/${closeProblem.data.id}/applications`, 'POST', proposal('close-a'));
    const closeAppB = await talentB(`/problems/${closeProblem.data.id}/applications`, 'POST', proposal('close-b'));
    assert.equal(closeAppA.status, 201, JSON.stringify(closeAppA.data));
    assert.equal(closeAppB.status, 201, JSON.stringify(closeAppB.data));
    const beforeCloseA = (await notificationList(talentA)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length;
    const beforeCloseB = (await notificationList(talentB)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length;
    const beforeCloseC = (await notificationList(talentC)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length;
    const closeResult = await company(`/problems/${closeProblem.data.id}/close`, 'POST');
    assert.equal(closeResult.status, 201, JSON.stringify(closeResult.data));
    assert.equal((await notificationList(talentA)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, beforeCloseA + 1, 'manual close notifies an under-review applicant');
    assert.equal((await notificationList(talentB)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, beforeCloseB + 1, 'manual close notifies every under-review applicant');
    assert.equal((await notificationList(talentC)).data.items.filter((entry: any) => entry.type === 'APPLICATION_DECIDED').length, beforeCloseC, 'manual close excludes an unsent application draft');
    const talentApplications = await talentC('/me/applications');
    assert.equal(talentApplications.data.items.find((item: any) => item.problemId === closeProblem.data.id)?.status, 'DRAFT');

    await app.close(); await pool.end();
    ({ app, pool } = await bootstrap(0));
    base = await app.getUrl();
    assert.equal((await notificationList(company)).data.unreadCount, 5, 'unread state and event history survive an API restart');
    assert.equal((await notificationList(company)).data.items.some((entry: any) => entry.type === 'APPLICATION_RECEIVED'), true);
  } finally { await app.close(); await pool.end(); }
});
