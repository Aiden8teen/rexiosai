import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('shared community enforces identity, counts, ownership and persistence', async t => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url && new URL(url).pathname.endsWith('_test'));
  process.env.DATABASE_URL = url;
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  const { bootstrap } = require('../dist/main');
  let { app, pool } = await bootstrap(0);
  let base = await app.getUrl();
  const origin = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',')[0];
  const client = () => {
    let cookie = '';
    return async (path: string, method = 'GET', body?: unknown) => {
      const response = await fetch(`${base}/api${path}`, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie')!.split(';')[0];
      return { status: response.status, data: await response.json() };
    };
  };
  const owner = client(), contributor = client(), outsider = client(), visitor = client(), visitor2 = client();
  const marker = randomUUID();
  let questionId = '', otherId = '', answerId = '', secondAnswerId = '';
  try {
    for (const [who, accountType, label] of [[owner,'COMPANY','owner'],[contributor,'TALENT','answerer'],[outsider,'TALENT','outsider']] as const) {
      assert.equal((await who('/auth/register','POST',{ name:`Community ${label}`,email:`community-${label}-${marker}@demo.test`,password:'Community123!',accountType })).status,201);
    }
    await t.test('exact IDs, language fallback, metadata and protected writes', async () => {
      assert.equal((await visitor('/community/questions/missing')).status,404);
      assert.equal((await visitor('/community/questions/missing/answers')).status,404);
      assert.ok((await visitor('/meta')).data.skills.includes('PYTHON'));
      const input = {language:'en',title:`Synthetic shared community ${marker}`,body:'<script>literal text only</script>\nA real persisted question.',tags:['PYTHON'],codeSnippet:'console.log("<example>");'};
      assert.equal((await visitor('/community/questions','POST',input)).status,401);
      assert.equal((await owner('/community/questions','POST',{...input,authorUserId:'forged'})).status,400);
      assert.equal((await owner('/community/questions','POST',{...input,title:'short'})).status,400);
      assert.equal((await owner('/community/questions','POST',{...input,tags:['PYTHON','PYTHON']})).status,400);
      const created = await owner('/community/questions','POST',input);
      assert.equal(created.status,201,JSON.stringify(created.data)); questionId=created.data.id;
      assert.equal(created.data.title,created.data.titleEn);
      assert.equal(created.data.body,input.body);
      assert.equal(created.data.codeSnippet,input.codeSnippet);
      assert.deepEqual(Object.keys(created.data.author).sort(),['avatarChar','id','name','nameEn','role']);
      const arabic = await owner('/community/questions','POST',{language:'ar',title:`سؤال عربي تجريبي عن البرمجة ${marker}`,body:'هذه تفاصيل السؤال بالعربية.',tags:['IOT']});
      assert.equal(arabic.status,201); otherId=arabic.data.id;
      assert.equal(arabic.data.title,arabic.data.titleEn);
      const list = await visitor(`/community/questions?q=${encodeURIComponent(marker)}&tag=PYTHON&limit=20`);
      assert.equal(list.data.total,1); assert.equal(list.data.items[0].id,questionId);
      assert.ok(!('body' in list.data.items[0]));
      assert.equal((await visitor('/community/questions?limit=51')).status,400);
    });
    await t.test('answers are shared and unanswered and active filters are real', async () => {
      const result = await contributor(`/community/questions/${questionId}/answers`,'POST',{language:'en',body:'Persisted engineering answer with a reproducible code example.'});
      assert.equal(result.status,201,JSON.stringify(result.data)); answerId=result.data.id;
      const another = await outsider(`/community/questions/${questionId}/answers`,'POST',{language:'ar',body:'إجابة ثانية مشتركة بين المستخدمين.'});
      assert.equal(another.status,201); secondAnswerId=another.data.id;
      const answers = await visitor(`/community/questions/${questionId}/answers?limit=1`);
      assert.equal(answers.data.total,2); assert.equal(answers.data.items.length,1);
      assert.equal(answers.data.items[0].body,answers.data.items[0].bodyEn);
      const unanswered = await visitor(`/community/questions?q=${marker}&sort=unanswered`);
      assert.deepEqual(unanswered.data.items.map((q:any)=>q.id),[otherId]);
      const active = await visitor(`/community/questions?q=${marker}&sort=active`);
      assert.equal(active.data.items[0].id,questionId);
    });
    await t.test('reactions and views are idempotent and scoped to real actors', async () => {
      assert.equal((await owner(`/community/questions/${questionId}/reactions/helpful`,'PUT')).status,400);
      assert.equal((await contributor(`/community/questions/${questionId}/reactions/helpful`,'PUT',{userId:'forged'})).status,400);
      const results=await Promise.all([contributor(`/community/questions/${questionId}/reactions/helpful`,'PUT'),contributor(`/community/questions/${questionId}/reactions/helpful`,'PUT')]);
      assert.deepEqual(results.map(r=>r.status),[200,200]);
      assert.equal((await contributor(`/community/questions/${questionId}`)).data.helpfulCount,1);
      assert.deepEqual((await contributor(`/community/questions/${questionId}`)).data.viewerReactions,['helpful']);
      assert.deepEqual((await outsider(`/community/questions/${questionId}`)).data.viewerReactions,[]);
      await contributor(`/community/questions/${questionId}/reactions/helpful`,'DELETE');
      assert.equal((await contributor(`/community/questions/${questionId}/reactions/helpful`,'DELETE')).data.helpfulCount,0);
      assert.equal((await contributor(`/community/answers/${answerId}/reactions/insight`,'PUT')).status,400);
      assert.equal((await owner(`/community/answers/${answerId}/reactions/insight`,'PUT')).data.insightCount,1);
      assert.equal((await visitor(`/community/questions/${questionId}/view`,'POST')).data.views,1);
      assert.equal((await visitor(`/community/questions/${questionId}/view`,'POST')).data.views,1);
      assert.equal((await visitor2(`/community/questions/${questionId}/view`,'POST')).data.views,2);
    });
    await t.test('only the owner selects a same-question answer and one selection wins', async () => {
      assert.equal((await outsider(`/community/questions/${questionId}/accepted-answer`,'PUT',{answerId})).status,403);
      assert.equal((await owner(`/community/questions/${otherId}/accepted-answer`,'PUT',{answerId})).status,404);
      const selected=await Promise.all([owner(`/community/questions/${questionId}/accepted-answer`,'PUT',{answerId}),owner(`/community/questions/${questionId}/accepted-answer`,'PUT',{answerId:secondAnswerId})]);
      assert.deepEqual(selected.map(r=>r.status),[200,200]);
      const answers=(await visitor(`/community/questions/${questionId}/answers`)).data.items;
      assert.equal(answers.filter((a:any)=>a.isAccepted).length,1);
      assert.equal((await owner(`/community/questions/${questionId}/accepted-answer`,'PUT',{answerId:null})).data.acceptedAnswerId,null);
      const overview=(await visitor('/community/overview')).data;
      assert.ok(overview.popularTags.some((tag:any)=>tag.tag==='PYTHON'));
      assert.ok(overview.contributors.every((row:any)=>!('email' in row.author)));
    });
    await t.test('sessions and shared posts persist across API restart', async () => {
      await app.close(); await pool.end();
      ({app,pool}=await bootstrap(0)); base=await app.getUrl();
      assert.equal((await owner('/auth/me')).status,200);
      assert.equal((await visitor(`/community/questions/${questionId}`)).data.answerCount,2);
      assert.equal((await visitor(`/community/questions/${questionId}`)).data.views,2);
    });
  } finally {await app.close();await pool.end();}
});
