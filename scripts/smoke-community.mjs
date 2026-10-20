import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const base=(process.env.SMOKE_BASE_URL||'http://localhost:3000').replace(/\/$/,'');
const origin=process.env.SMOKE_ORIGIN||new URL(base).origin;
let ready=false;
for(let i=0;i<60;i++){
  try{if((await fetch(`${base}/api/health`)).ok){ready=true;break;}}catch{/* startup */}
  await new Promise(resolve=>setTimeout(resolve,250));
}
assert.ok(ready,`API not ready at ${base}`);
function client(initial=''){
  let cookie=initial;
  const call=async(path,method='GET',body,expected=200)=>{
    const response=await fetch(`${base}/api${path}`,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
    if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    const data=await response.json();
    assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(data)}`);
    return data;
  };
  call.cookie=()=>cookie;
  return call;
}

// Optional local state lets packaged restart/seed verification reuse these exact
// sessions and records. It contains only synthetic demo accounts/session cookies.
if(process.env.SMOKE_VERIFY_STATE){
  const state=JSON.parse(await readFile(process.env.SMOKE_VERIFY_STATE,'utf8'));
  const owner=client(state.ownerCookie),answerer=client(state.answerCookie);
  assert.equal((await owner('/auth/me')).id,state.ownerId);
  const question=await owner(`/community/questions/${state.questionId}`);
  assert.equal(question.acceptedAnswerId,state.answerId);
  assert.equal(question.helpfulCount,1);
  assert.equal((await answerer(`/community/questions/${state.questionId}`)).viewerReactions[0],'helpful');
  assert.ok((await owner('/notifications')).items.some(n=>n.id===state.notificationId&&n.readAt));
  console.log(`Community restart/seed persistence passed at ${base}.`);
  process.exit(0);
}

const marker=randomUUID().slice(0,8);
const owner=client(),answerer=client(),visitor=client();
const ownerUser=await owner('/auth/register','POST',{name:`Smoke forum company ${marker}`,email:`forum-c-${marker}@demo.test`,password:'ForumDemo123!',accountType:'COMPANY'},201);
await answerer('/auth/register','POST',{name:`Smoke forum talent ${marker}`,email:`forum-t-${marker}@demo.test`,password:'ForumDemo123!',accountType:'TALENT'},201);
const q=await owner('/community/questions','POST',{language:'en',title:`Synthetic community smoke ${marker}`,body:'How should a workshop prototype document sensor calibration and offline alerts?',tags:['IOT'],codeSnippet:'// This is a literal example.'},201);
assert.equal((await visitor(`/community/questions/${q.id}`)).title,q.title);
const a=await answerer(`/community/questions/${q.id}/answers`,'POST',{language:'en',body:'Store the calibration record locally and include a documented alert threshold.'},201);
assert.equal((await visitor(`/community/questions/${q.id}/answers`)).items[0].id,a.id);
assert.equal((await answerer(`/community/questions/${q.id}/reactions/helpful`,'PUT')).helpfulCount,1);
assert.equal((await answerer(`/community/questions/${q.id}/reactions/helpful`,'DELETE')).helpfulCount,0);
await answerer(`/community/questions/${q.id}/reactions/helpful`,'PUT');
await answerer(`/community/questions/${q.id}/accepted-answer`,'PUT',{answerId:a.id},403);
await owner(`/community/questions/${q.id}/accepted-answer`,'PUT',{answerId:a.id});
assert.equal((await visitor(`/community/questions/${q.id}/answers`)).items[0].isAccepted,true);
assert.ok((await visitor('/community/overview')).popularTags.some(tag=>tag.tag==='IOT'));
const feed=await owner('/notifications');
const notification=feed.items.find(n=>n.type==='COMMUNITY_ANSWER');assert.ok(notification);
await answerer(`/notifications/${notification.id}/read`,'PATCH',undefined,404);
await owner(`/notifications/${notification.id}/read`,'PATCH');
assert.equal((await owner('/notifications')).unreadCount,feed.unreadCount-1);
assert.ok((await answerer('/notifications')).items.some(n=>n.type==='ANSWER_ACCEPTED'));
await visitor('/community/questions/nonexistent','GET',undefined,404);
if(process.env.SMOKE_STATE_FILE)await writeFile(process.env.SMOKE_STATE_FILE,JSON.stringify({ownerCookie:owner.cookie(),answerCookie:answerer.cookie(),ownerId:ownerUser.id,questionId:q.id,answerId:a.id,notificationId:notification.id}));
console.log(`Community smoke passed at ${base}; synthetic question ${q.id} retained.`);
