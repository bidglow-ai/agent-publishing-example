// BidGlow reference client. Node.js 22+. No dependencies. No payment operations.
import {randomUUID, randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';

function checkedOrigin(value) {
  const url = new URL(value);
  if (url.origin !== value || (value !== 'https://bidglow.ai' &&
      !(url.protocol === 'http:' && url.hostname === '127.0.0.1'))) {
    throw new Error('Use the official HTTPS origin or an explicit loopback test server.');
  }
  return value;
}

async function request(origin, path, options = {}) {
  const response = await fetch(origin + path, {
    ...options, redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Never log an untrusted response body: it may contain private receipt data.
    const retryAfter = response.headers.get('retry-after');
    throw new Error('HTTP ' + response.status + (retryAfter ? '; respect Retry-After' : '') +
      '. Retain the original state; do not rotate credentials or claim success.');
  }
  return {httpStatus: response.status, value: await response.json()};
}

/**
 * store.load()/save(state) must use private, durable storage in real integrations.
 * save must complete before resolving. Never place state in logs or a public repo.
 * A publication request is NOT permission to charge, bid or post elsewhere.
 */
export async function publishApprovedListing({
  origin = 'https://bidglow.ai', destination, category, approved = false, store,
}) {
  checkedOrigin(origin);
  if (approved !== true) throw new Error('Explicit approval for this free listing is required.');
  if (!store || typeof store.load !== 'function' || typeof store.save !== 'function') {
    throw new Error('A private durable receipt store is required.');
  }
  const url = new URL(destination);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || !category || typeof category !== 'string') {
    throw new Error('Use a public URL without credentials, query or fragment and a category ID.');
  }
  let state = await store.load();
  if (state) {
    if (state.origin !== origin || state.body?.destination !== destination ||
        state.body?.category !== category || state.body?.approval?.userApproved !== true ||
        state.body?.approval?.scope !== 'free_listing_publish' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(state.key) ||
        !/^[0-9a-f]{64}$/.test(state.secret)) {
      throw new Error('Stored request does not match. Do not overwrite or reuse it for another listing.');
    }
  } else {
    const {value: capabilities} = await request(origin, '/api/v1/agent/capabilities');
    if (capabilities.capabilities?.freePublishing !== true || capabilities.discovery?.available !== true ||
        !capabilities.categories?.some(item => item.id === category) ||
        capabilities.publishingPolicy?.approvalScope !== 'free_listing_publish' ||
        typeof capabilities.publishingPolicy?.rulesVersion !== 'string') {
      throw new Error('Free publishing, category or approval policy is unavailable. Nothing submitted.');
    }
    state = {
      origin, key: randomUUID(), secret: randomBytes(32).toString('hex'),
      body: {destination, category, approval: {
        scope: 'free_listing_publish', userApproved: true,
        rulesVersion: capabilities.publishingPolicy.rulesVersion,
      }},
    };
    await store.save(state); // Must succeed BEFORE the first publication request.
  }
  const {httpStatus, value: receipt} = await request(origin, '/api/v1/agent/listings', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Idempotency-Key': state.key,
      'X-Submission-Secret': state.secret},
    body: JSON.stringify(state.body),
  });
  await store.save({...state, receipt}); // Retain private management links privately.
  if (![200, 201].includes(httpStatus) || receipt.chargeCreated !== false ||
      receipt.paidRankingChanged !== false ||
      !['published', 'expired', 'unavailable'].includes(receipt.status)) {
    throw new Error('Unexpected receipt. State retained; verify privately before continuing.');
  }
  // Deliberate allowlist: never return ownership/privateRecoveryUrl to public output.
  const summary = {httpStatus, status: receipt.status, chargeCreated: false,
    paidRankingChanged: false};
  if (receipt.status === 'published') {
    const publicUrl = new URL(receipt.productUrl);
    if (publicUrl.username || publicUrl.password || publicUrl.hash || publicUrl.search ||
        !publicUrl.pathname.startsWith('/product/') ||
        (origin === 'https://bidglow.ai' ? publicUrl.origin !== origin :
          !['127.0.0.1', 'localhost'].includes(publicUrl.hostname)) ||
        !['http:', 'https:'].includes(publicUrl.protocol)) {
      throw new Error('Unexpected public URL. Inspect the saved receipt privately.');
    }
    return {...summary, productUrl: publicUrl.href, expiresAt: receipt.expiresAt};
  }
  return summary;
}

// Runnable contract simulation: binds only to loopback, never contacts BidGlow.
// This is NOT a production backend, moderation test, customer case or AI endorsement.
export async function runDemo() {
  const {createServer} = await import('node:http');
  const assert = await import('node:assert/strict');
  const ledger = new Map();
  let publications = 0;
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET' && req.url === '/api/v1/agent/capabilities') {
      res.end(JSON.stringify({capabilities: {freePublishing: true}, discovery: {available: true},
        publishingPolicy: {approvalScope: 'free_listing_publish', rulesVersion: '2026-09-06'},
        categories: ['Personal Profiles', 'Business, Finance & Legal', 'Developer Tools'].map(id => ({id}))}));
      return;
    }
    if (req.method !== 'POST' || req.url !== '/api/v1/agent/listings') {
      res.writeHead(404); res.end('{}'); return;
    }
    let body = ''; for await (const chunk of req) body += chunk;
    const key = req.headers['idempotency-key'], secret = req.headers['x-submission-secret'];
    const previous = ledger.get(key);
    if (previous && (previous.body !== body || previous.secret !== secret)) {
      res.writeHead(409); res.end('{}'); return;
    }
    if (!previous) {
      publications++;
      const productUrl = 'http://127.0.0.1:' + server.address().port + '/product/demo-' + publications;
      ledger.set(key, {body, secret, receipt: {status: 'published', productUrl,
        expiresAt: Date.now() + 60 * 86400000, chargeCreated: false, paidRankingChanged: false,
        ownership: {privateRecoveryUrl: productUrl + '#owner=DEMO-PRIVATE-NOT-A-REAL-KEY'}}});
    }
    res.writeHead(previous ? 200 : 201); res.end(JSON.stringify(ledger.get(key).receipt));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const [name, category] of [['profile', 'Personal Profiles'], ['company', 'Business, Finance & Legal'], ['app', 'Developer Tools']]) {
      let saved; // Memory is acceptable ONLY for this disposable simulation.
      const store = {load: async () => saved, save: async value => {saved = structuredClone(value);}};
      const input = {origin, destination: 'https://' + name + '.example/', category, approved: true, store};
      const first = await publishApprovedListing(input), replay = await publishApprovedListing(input);
      assert.equal(first.httpStatus, 201); assert.equal(replay.httpStatus, 200);
      assert.equal(first.productUrl, replay.productUrl);
      assert.equal(JSON.stringify(first).includes('owner'), false);
    }
    assert.equal(publications, 3);
    return {mode: 'loopback contract simulation',publications, replays: 3, payments: 0,
      productionRequests: 0, realCustomers: 0};
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length > 2) {
    console.error('No CLI publishing flags. Run without arguments for the isolated demo; read the guide for integration.');
    process.exitCode = 1;
  } else {
    runDemo().then(result => console.log(JSON.stringify(result, null, 2))).catch(() => {
      console.error('Simulation failed. No success claimed.'); process.exitCode = 1;
    });
  }
}
