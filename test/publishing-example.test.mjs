import assert from 'node:assert/strict';
import test from 'node:test';
import {publishApprovedListing, runDemo} from '../agent-publish.mjs';

function memoryStore() { let saved; return {load:async()=>saved,save:async value=>{saved=structuredClone(value);}}; }
test('reference client rejects absent approval and unsafe input before any network request',async t=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=()=>{calls++;throw Error('Unexpected request');};t.after(()=>{globalThis.fetch=original;});
  const input={destination:'https://fixture.example/',category:'Developer Tools',store:memoryStore()};
  await assert.rejects(publishApprovedListing(input),/Explicit approval/);
  await assert.rejects(publishApprovedListing({...input,approved:true,store:undefined}),/private durable/);
  await assert.rejects(publishApprovedListing({...input,approved:true,destination:'https://fixture.example/?token=private'}),/without credentials/);
  await assert.rejects(publishApprovedListing({...input,approved:true,origin:'https://unrelated.example'}),/official HTTPS origin/);
  assert.equal(calls,0);
});

test('local demo uses only loopback HTTP and completes 3 publications plus identical replays without production or payments',async t=>{
  const original=globalThis.fetch;const paths=[];
  globalThis.fetch=(input,options)=>{
    const url=new URL(input);
    assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');
    assert.ok(['/api/v1/agent/capabilities','/api/v1/agent/listings'].includes(url.pathname));
    paths.push({path:url.pathname,method:options?.method||'GET'});
    return original(input,options);
  };
  t.after(()=>{globalThis.fetch=original;});
  const result=await runDemo();
  assert.deepEqual(result,{mode:'loopback contract simulation',publications:3,replays:3,payments:0,productionRequests:0,realCustomers:0});
  assert.equal(paths.filter(x=>x.method==='GET').length,3);
  assert.equal(paths.filter(x=>x.method==='POST').length,6);
  assert.doesNotMatch(JSON.stringify(result),/privateRecoveryUrl|owner=|submissionSecret|idempotencyKey/);
});

test('public client preserves numeric retry guidance without disclosing arbitrary error bodies',async t=>{
  const original=globalThis.fetch;
  t.after(()=>{globalThis.fetch=original;});
  for(const retry of ['120','not-a-number','99999999999999999999999999']){
    globalThis.fetch=async()=>new Response('private response body must not appear',{status:429,headers:{'Retry-After':retry}});
    await assert.rejects(publishApprovedListing({destination:'https://fixture.example/',category:'Developer Tools',approved:true,store:memoryStore()}),error=>{
      assert.equal(error.status,429);
      assert.equal(error.retryAfterSeconds,retry==='120'?120:undefined);
      assert.doesNotMatch(error.message,/private response body/);
      return true;
    });
  }
});
