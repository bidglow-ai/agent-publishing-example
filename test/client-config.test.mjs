import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import test from 'node:test';
import {spawnSync} from 'node:child_process';

const root = new URL('../', import.meta.url);
const endpoint = 'https://bidglow.ai/api/mcp';
const tools = ['capabilities', 'quote', 'publish_free'];
const manifest = JSON.parse(await readFile(new URL('gemini-extension.json', root), 'utf8'));
const guide = await readFile(new URL('CLIENTS.md', root), 'utf8');
const readme = await readFile(new URL('README.md', root), 'utf8');

function assertReviewedManifest(value) {
  assert.deepEqual(Object.keys(value).sort(), ['description', 'mcpServers', 'name', 'version']);
  assert.equal(value.name, 'bidglow-publishing');
  assert.equal(value.version, '2.0.0');
  assert.match(value.description, /approved free listings/);
  assert.match(value.description, /confirmations enabled/);
  assert.deepEqual(value.mcpServers, {bidglow: {httpUrl: endpoint, includeTools: tools}});
}

test('manifest matches the reviewed public capabilities, quote and approved-publication contract', () => {
  assertReviewedManifest(manifest);
  assert.doesNotMatch(JSON.stringify(manifest), /prepare_launch|bidglow-draft/);
});

test('manifest guard rejects retired tools, automatic trust, local execution and extra settings', () => {
  const changes = [
    value => value.mcpServers.bidglow.includeTools.push('prepare_launch'),
    value => value.mcpServers.bidglow.includeTools.push('pay'),
    value => delete value.mcpServers.bidglow.includeTools,
    value => value.mcpServers.bidglow.trust = true,
    value => value.mcpServers.bidglow.command = 'node',
    value => value.mcpServers.bidglow.headers = {Authorization: 'test-only-placeholder'},
    value => value.mcpServers.other = {httpUrl: endpoint},
    value => value.contextFileName = 'GEMINI.md',
    value => value.hooks = {},
  ];
  for (const change of changes) {
    const altered = structuredClone(manifest); change(altered);
    assert.throws(() => assertReviewedManifest(altered), assert.AssertionError);
  }
});

test('extension ships no auto-loaded context, hooks, commands or skills', async () => {
  for (const path of ['GEMINI.md', 'hooks', 'commands', 'skills', 'agents']) {
    await assert.rejects(access(new URL(path, root)), {code: 'ENOENT'});
  }
});

test('active configuration advertises no draft tool and migration never transfers draft approval', () => {
  const examples = [...guide.matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1]));
  assert.deepEqual(examples, [{mcpServers: manifest.mcpServers}]);
  const commands = [...guide.matchAll(/```sh\n([\s\S]*?)\n```/g)].map(match => match[1]);
  for (const command of commands) {
    assert.doesNotMatch(command, /--(?:consent|auto-update|dangerously-skip-permissions)\b|prepare-launch\.mjs|prepare_launch/);
  }
  for (const command of [
    'gemini extensions install https://github.com/bidglow-ai/agent-publishing-example',
    'gemini extensions uninstall bidglow-publishing',
    'gemini extensions uninstall bidglow-draft-launch',
  ]) assert.ok(guide.includes(command));
  for (const text of ['not a silent upgrade','Disable or remove the old draft extension/server yourself','Do not auto-update an old','previous draft-only approval is never publication approval','These files do not edit your client settings or migrate permissions','Removing a connection does not remove a published listing']) assert.ok(guide.includes(text),text);
  assert.doesNotMatch(readme,/\[[^\]]*\]\([^)]*prepare-launch\.mjs\)|draft-first client setup|Live draft generation/);
});

test('client limitations and voluntary testing do not imply payment, independent customers or blanket consent', () => {
  for (const text of ['UNSUPPORTED_CLIENT','agent-client-status.json','native AI-client pass','Configuration is not a successful acceptance test','A client\'s approval denial is a stop','explicit approval to publish the exact public destination','private durable storage','Every payment requires the customer']) assert.ok(guide.includes(text),text);
  for (const text of ['up to 10 volunteers','admin@bidglow.ai','confirm your interest first','send the test steps privately','not approval to publish anything','No purchase or positive review','do not promise visitors','not a real customer','stop at any point']) assert.ok(readme.includes(text),text);
});

test('retired draft command performs no network operation, publishes nothing and does not echo supplied URLs', async () => {
  const source = await readFile(new URL('prepare-launch.mjs', root), 'utf8');
  assert.doesNotMatch(source,/\b(?:fetch|import|require|publishApprovedListing)\s*\(|\bimport\s|process\.argv/);
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    let networkCalls=0;
    globalThis.fetch=()=>{networkCalls++;throw new Error('network forbidden');};
    await import(${JSON.stringify(new URL('prepare-launch.mjs', root).href)});
    console.log(JSON.stringify({networkCalls}));
  `, 'https://private.example/?token=do-not-echo'], {encoding:'utf8',timeout:5000});
  assert.equal(child.status,1);
  assert.deepEqual(JSON.parse(child.stdout),{networkCalls:0});
  assert.match(child.stderr,/retired on October 8, 2026/);
  assert.match(child.stderr,/no network request, publication or payment/);
  assert.doesNotMatch(child.stdout+child.stderr,/do-not-echo|private\.example/);
});
