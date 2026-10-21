import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { upgradeDemoContent } from '../prisma/demo-content';

test('seed content is bilingual, matches profile choices and preserves edits', async () => {
  const url=process.env.TEST_DATABASE_URL;
  assert.ok(url&&new URL(url).pathname.endsWith('_test'));
  const db=new pg.Client({connectionString:url});await db.connect();
  try {
    execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
    const seed=()=>execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','prisma/seed.ts'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
    seed();
    const revision='2026-10-21-bilingual-content-v3';
    await db.query('DELETE FROM "SeedContentRevision" WHERE id=$1',[revision]);
    const clients=[0,1].map(()=>new PrismaClient({adapter:new PrismaPg({connectionString:url})}));
    try {
      await Promise.all(clients.map(client=>upgradeDemoContent(client)));
      assert.equal((await db.query('SELECT count(*)::int AS count FROM "SeedContentRevision" WHERE id=$1',[revision])).rows[0].count,1);
    } finally {await Promise.all(clients.map(client=>client.$disconnect()));}
    const profile=(await db.query('SELECT * FROM "TalentProfile" WHERE "userId"=\'demo-solver\'')).rows[0];
    assert.equal(profile.educationLevel,'ماستر 1 / 2');
    assert.equal(profile.experienceLevel,'1–3 سنوات خبرة');
    assert.equal(profile.firstNameEn,'Sara');
    assert.ok(profile.institutionMajorEn.includes('USTHB'));
    const application=(await db.query('SELECT * FROM "Application" WHERE id=\'seed-application-p2\'')).rows[0];
    assert.match(application.coverMessage,/[\u0600-\u06ff]/u);
    assert.match(application.coverMessageEn,/dashboard/i);
    const privateDetails=(await db.query('SELECT * FROM "ProblemPrivateDetails" WHERE "problemId"=\'p2\'')).rows[0];
    assert.match(privateDetails.notes,/[\u0600-\u06ff]/u);
    assert.match(privateDetails.notesEn,/packaging/i);
    await db.query('UPDATE "Application" SET "coverMessage"=$1,"coverMessageEn"=$2 WHERE id=\'seed-application-p2\'',['A custom cover edit','A custom English edit']);
    seed();
    assert.equal((await db.query('SELECT "coverMessageEn" FROM "Application" WHERE id=\'seed-application-p2\'')).rows[0].coverMessageEn,'A custom English edit');
    // Restore the content owned by this check, not unrelated application state.
    await db.query('UPDATE "Application" SET "coverMessage"=$1,"coverMessageEn"=$2 WHERE id=\'seed-application-p2\'',[application.coverMessage,application.coverMessageEn]);
  } finally {await db.end();}
});
