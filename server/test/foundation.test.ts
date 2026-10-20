import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

test('seed is repeatable and preserves edited fixture data', async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url && new URL(url).pathname.endsWith('_test'), 'Use a separate *_test database');
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  try {
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
    const runSeed = () => execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
    runSeed();
    assert.equal((await db.query('SELECT count(*) FROM "Problem" WHERE id IN (\'p1\',\'p2\',\'p3\',\'p4\')')).rows[0].count, '4');
    await db.query('UPDATE "Problem" SET title = $1 WHERE id = $2', ['Preserved company edit', 'p1']);
    const originalDeadline = (await db.query('SELECT "deadlineAt" FROM "Problem" WHERE id=$1', ['p1'])).rows[0].deadlineAt.toISOString();
    await db.query('UPDATE "Application" SET status=\'REJECTED\', "rejectionReason"=$1 WHERE id=$2', ['Preserve this review decision', 'seed-application-p1']);
    runSeed();
    assert.equal((await db.query('SELECT title FROM "Problem" WHERE id=$1', ['p1'])).rows[0].title, 'Preserved company edit');
    assert.equal((await db.query('SELECT "deadlineAt" FROM "Problem" WHERE id=$1', ['p1'])).rows[0].deadlineAt.toISOString(), originalDeadline);
    assert.equal((await db.query('SELECT "rejectionReason" FROM "Application" WHERE id=$1', ['seed-application-p1'])).rows[0].rejectionReason, 'Preserve this review decision');
    assert.ok(!readFileSync('prisma/seed.ts', 'utf8').includes('deleteMany'));
  } finally { await db.end(); }
});
