# Publish through your own AI: BidGlow reference example

For personal profiles, company websites, services, portfolios and products.
Maintained by BidGlow / Blessbridge Global Trading LLC. This is a first-party
engineering example, not an independent customer review or an AI-provider partnership.

## Run safely in one minute

Using Gemini CLI, Claude Code, Cursor or VS Code? Start with the
[client setup](https://bidglow.ai/examples/CLIENTS.md), including
the optional Gemini CLI extension. Configuration does not prove that a client
account can execute tools; keep the documented approval and filtering boundaries.

HTML setup, MCP configuration and client limitations:
https://bidglow.ai/developers#agent-readiness

### Local publication simulation

Requires Node.js 22 or newer. Download and inspect
[agent-publish.mjs](https://bidglow.ai/examples/agent-publish.mjs), then run:

```sh
node agent-publish.mjs
```

No install, API key, card, account or environment file is needed for the demo.
It starts a disposable server on 127.0.0.1, runs three synthetic examples and exits.
It does not contact BidGlow or any submitted website. It does not deploy a website.

Expected output (only after assertions pass):

```json
{
  "mode": "loopback contract simulation",
  "publications": 3,
  "replays": 3,
  "payments": 0,
  "productionRequests": 0,
  "realCustomers": 0
}
```

The fixtures cover a personal profile, a company website and a developer app.
They are illustrative .example destinations, not customer testimonials.
Each first request returns 201; an identical retry returns 200 with the same public
URL. Private recovery links are omitted from terminal output.

## What is real, and what is simulated?

- The downloadable client performs actual HTTP GET/POST requests to the loopback
  server, generates random per-request proof, saves state before POST, and replays it.
- The bundled server simulates the public contract. Its metadata review and
  persistence are NOT the production backend. Its in-memory store is disposable.
- BidGlow's private application regression suite also exercises this same exported
  client against its actual publication route and isolated SQLite database.
  That integration test substitutes content review and uses no Stripe credentials.
- Neither test proves a particular AI model's skill, customer demand, live content
  acceptance, traffic, or successful payment. No production test listings are made.

## Integrate with a real customer-owned agent

1. Read the [live capabilities](https://bidglow.ai/api/v1/agent/capabilities),
   [guide](https://bidglow.ai/agent-guide.md), [OpenAPI](https://bidglow.ai/openapi.json)
   and [rules](https://bidglow.ai/rules). Use current category IDs and offer dates.
2. Explain the 60-day free listing term during the current offer, content review,
   public destination, optional paid placement, and lack of traffic guarantees.
   Obtain explicit permission for that specific listing.
3. Import `publishApprovedListing` from the inspected file. Supply a private durable
   store with asynchronous `load()` and `save(state)` methods for ONE listing request.
   A save must finish durable persistence before resolving. Use your agent's secure
   secret store or encrypted vault, not the demo's memory store. Serialize calls for
   a given store; do not share one store between different destinations.
4. Invoke the function with the approved real destination, an exact category ID,
   `approved: true`, and that store. Default origin is https://bidglow.ai.
   Calling the exported function against production WILL publish if accepted;
   downloading or running the default demo will not.

```js
import {publishApprovedListing} from './agent-publish.mjs';

// Integration sketch, not a runnable production command.
// Define privateDurableStore and obtain the user's explicit approval first.
const publicResult = await publishApprovedListing({
  destination: approvedDestination,
  category: approvedCategory,
  approved: explicitUserApproval,
  store: privateDurableStore,
});
// This is the sanitized result, NOT the full stored receipt.
console.log(publicResult);
```

The function rejects missing approval before any network operation. New submissions
check current free availability and category IDs. The saved state holds the exact
request, UUIDv4 key, independent 32-byte secret, and full private receipt.
Never paste this state, secrets or private management links into public chats,
Git repositories, screenshots, analytics, command arguments or issue reports.

## Failure and replay checklist

- If durable storage fails before POST: stop. Nothing may be published yet.
- Timeout or lost response: do not claim success or failure. Retain state and repeat
  with the same store, destination and category. Never rotate the proof to retry.
- 409: conflict; do not overwrite state, claim someone else's listing or alter the URL.
- 410: free window closed. Existing receipts may still be replayed using saved state.
- 422: content rejected. A client cannot bypass review.
- 429: wait according to Retry-After; no identity rotation or retry loop.
- 503: keep original state and retry later, not continuously.
- Published: expose only the sanitized public result. Expired/unavailable: do not claim
  a live listing; inspect the private receipt/support link privately.
- Losing both the credentials and management link is not recoverable from a URL alone.

## Optional bidding is a different task

This example contains no quote, checkout, payment or automatic-bidding code.
An agent may separately request a non-charging quote with user permission.
The customer must review and confirm every payment through Stripe.
No saved card, background payment or automatic top-10 maintenance is enabled.

## Ten voluntary testers welcome

We are inviting up to 10 volunteers who have their own public website, profile,
business page or app and want to check the customer-owned AI publishing flow.
You can run the isolated demo without joining a study or contacting us.

To volunteer, email [admin@bidglow.ai](mailto:admin@bidglow.ai) with the subject
"BidGlow voluntary AI publishing test". Tell us which AI client you use and whether
you want to try the local demo or discuss one real free listing. A public website
URL is optional at this first step; do not send credentials, receipts or card details.

We will confirm your interest first, then send the test steps privately. Emailing us
is not approval to publish anything. Participation, a specific public listing,
optional payment, and permission to quote feedback are separate choices. You may
stop at any point. No purchase or positive review is required; failures and criticism
are welcome. We do not promise visitors, sales, search rankings or AI recommendations.

A synthetic demo is engineering evidence, not a real customer, testimonial or live
publication. We will ask separately before publishing any identifiable case or quote.

## Retired draft setup

Draft generation was removed on October 8, 2026. There is no draft step before
publication. The retained `prepare-launch.mjs` command now prints a retirement notice
and exits without network requests, publication or payment; it is not a publishing
shortcut. Previously installed `bidglow-draft-launch` extensions or `bidglow-draft`
servers require a reviewed manual migration. See [client migration](https://bidglow.ai/examples/CLIENTS.md#review-existing-draft-connections-before-migrating).
Previous permission to generate a draft never authorizes a real public listing.

## Offline checks

In the [public example repository](https://github.com/bidglow-ai/agent-publishing-example),
`node --test test/*.test.mjs` checks the public configuration, retired-command safety,
receipt/approval boundaries and the isolated demo. It installs no AI configuration
and makes no production requests. Passing does not certify a native AI client.

English is the canonical technical source. Updated October 14, 2026.
