import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const endpoint = 'https://bidglow.ai/api/mcp';
const draftTools = ['capabilities', 'prepare_launch'];
const manifest = JSON.parse(await readFile(new URL('gemini-extension.json', root), 'utf8'));
const guide = await readFile(new URL('CLIENTS.md', root), 'utf8');

function assertDraftOnlyManifest(value) {
  assert.deepEqual(Object.keys(value).sort(), ['description', 'mcpServers', 'name', 'version']);
  assert.equal(value.name, 'bidglow-draft-launch');
  assert.equal(value.version, '1.0.0');
  assert.equal(typeof value.description, 'string');
  assert.ok(value.description.length > 0 && value.description.length <= 200);
  assert.deepEqual(value.mcpServers, {
    'bidglow-draft': {httpUrl: endpoint, includeTools: draftTools},
  });
}

test('manifest contains only the remote endpoint and the two draft tools', () => {
  assertDraftOnlyManifest(manifest);
});

test('guard rejects publication, quote, trust, local execution and extra servers', () => {
  const changes = [
    value => value.mcpServers['bidglow-draft'].includeTools.push('publish_free'),
    value => value.mcpServers['bidglow-draft'].includeTools.push('quote'),
    value => delete value.mcpServers['bidglow-draft'].includeTools,
    value => value.mcpServers['bidglow-draft'].trust = true,
    value => value.mcpServers['bidglow-draft'].command = 'node',
    value => value.mcpServers['bidglow-draft'].headers = {Authorization: 'test-only-placeholder'},
    value => value.mcpServers.other = {httpUrl: endpoint},
    value => value.contextFileName = 'GEMINI.md',
    value => value.hooks = {},
  ];
  for (const change of changes) {
    const altered = structuredClone(manifest);
    change(altered);
    assert.throws(() => assertDraftOnlyManifest(altered), assert.AssertionError);
  }
});

test('extension does not supply auto-loaded context, hooks, commands or skills', async () => {
  for (const path of ['GEMINI.md', 'hooks', 'commands', 'skills', 'agents']) {
    await assert.rejects(access(new URL(path, root)), {code: 'ENOENT'});
  }
});

test('all three manual JSON examples parse and retain client-specific field names', () => {
  const examples = [...guide.matchAll(/```json\n([\s\S]*?)\n```/g)]
    .map(match => JSON.parse(match[1]));
  assert.deepEqual(examples, [
    {mcpServers: manifest.mcpServers},
    {mcpServers: {'bidglow-draft': {url: endpoint}}},
    {mcpServers: {'bidglow-draft': {type: 'http', url: endpoint}}},
  ]);
});

test('documented install and removal commands use the declared extension and server', () => {
  for (const command of [
    'gemini extensions install https://github.com/bidglow-ai/agent-publishing-example',
    `gemini extensions uninstall ${manifest.name}`,
    `claude mcp add --transport http bidglow-draft --scope local ${endpoint}`,
    'claude mcp remove bidglow-draft --scope local',
  ]) assert.ok(guide.includes(command), `Missing command: ${command}`);
  const commands = [...guide.matchAll(/```sh\n([\s\S]*?)\n```/g)].map(match => match[1]);
  for (const command of commands) {
    assert.doesNotMatch(command, /--(?:consent|auto-update|dangerously-skip-permissions)\b/);
  }
});

test('guide retains safety checks, client-evidence limitations and primary sources', () => {
  for (const text of [
    'published: false', 'chargeCreated: false', 'UNSUPPORTED_CLIENT',
    'not a server-side authorization boundary', 'have not independently established',
    'https://geminicli.com/docs/extensions/reference/',
    'https://geminicli.com/docs/tools/mcp-server/',
    'https://code.claude.com/docs/en/mcp',
    'https://prod.cursor.com/help/customization/mcp',
    'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
  ]) assert.ok(guide.includes(text), `Missing safety text or source: ${text}`);
});
