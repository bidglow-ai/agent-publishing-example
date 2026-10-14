# Connect your own AI to BidGlow

HTML setup and known client limitations: https://bidglow.ai/developers#agent-readiness
Full transport and tool contract: https://bidglow.ai/mcp-guide.md
Publication guide: https://bidglow.ai/agent-guide.md

Use a compatible server-side Streamable HTTP MCP client with endpoint
https://bidglow.ai/api/mcp. Browser chat alone does not imply HTTP tool access.
Client access and billing belong to the provider; this setup does not grant them.
The Gemini CLI account tested on October 3 returned UNSUPPORTED_CLIENT before
execution. Configuration is not a successful acceptance test or AI endorsement.

## Dated evidence, not an installation guarantee

The canonical [client evidence record](https://bidglow.ai/agent-client-status.json)
contains the client, version, actual check date, outcome and native acceptance
status. The [developer page](https://bidglow.ai/developers#agent-readiness) renders
that same record in the selected language. A guide's update date is not a new test
date. A protocol/SDK pass must never be described as a native AI-client pass.

A client's approval denial is a stop, not an invitation to bypass its controls.
For an interactive acceptance, the account
must support MCP, private durable storage and the normal user confirmation for the
specific test; keep that confirmation enabled. Do not mark a run passed until the
public result, identical replay, private receipt retention and zero-charge result
have all been checked.

## Test without buying another AI subscription

- The downloadable loopback demo needs Node.js, not an AI subscription, API key or
  payment card. It tests the HTTP contract, not a particular model.
- If you already have Codex access, use its existing account and included usage for
  a native test. Provider limits still apply; this is not a promise of unlimited
  or free provider usage. Do not switch to a billable API key to finish a test.
- Claude Code requires a supported subscription, organization or billed provider
  route. An existing eligible subscription can cover included Code usage; a free
  Claude browser login does not establish Code entitlement. Do not purchase a plan,
  enable extra usage or configure an API key just to run this example.
- Claude's free web plan currently supports one custom remote connector, subject
  to the provider's current limits. This is a separate client, not free Claude Code.
  Remote connectors reach the server from Anthropic's cloud, so a local 127.0.0.1
  fixture will not work. A cloud publication test requires an isolated public HTTPS
  test service and verified private durable receipt storage first. Until then,
  limit this path to capabilities and non-charging quotes; do not publish.

Official references (checked October 14, 2026):
- https://code.claude.com/docs/en/authentication
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

## Client-specific connection instructions

These commands change client configuration; review them and check for an existing
BidGlow connection first. They do not authorize publication or certify compatibility.
The production endpoint below is NOT the isolated test endpoint.

### Codex CLI

```sh
codex mcp add bidglow --url https://bidglow.ai/api/mcp
```

Keep ordinary tool confirmations. To remove this named connection:

```sh
codex mcp remove bidglow
```

### Claude Code

```sh
claude mcp add --transport http --scope local bidglow https://bidglow.ai/api/mcp
```

The local scope limits the connection to the current project. Use `/mcp` to inspect
tools and connection state. To remove it from the same project:

```sh
claude mcp remove --scope local bidglow
```

Official reference: https://code.claude.com/docs/en/mcp

Connecting or disconnecting does not publish or delete a listing. On every client,
start with capabilities and stop if tools, permissions or private storage are missing.

## Review existing draft connections before migrating

Draft generation and the `prepare_launch` tool were retired on October 8, 2026.
The old `prepare-launch.mjs` command now only reports retirement and exits without
network requests. It does not automatically call a publication tool.

This is a capability change, not a silent upgrade of the old draft-only grant:

1. Review the installed `bidglow-draft-launch` extension and every `bidglow-draft`
   server entry in project, user and extension settings. Also check older unrestricted
   `bidglow` connections and their approval rules.
2. Disable or remove the old draft extension/server yourself through your client's
   settings. Do not overwrite unrelated settings or delete private receipts.
3. Inspect the new `bidglow-publishing` 2.0.0 manifest and its three tools. Decide
   whether you actually want publication tools enabled. Do not auto-update an old
   connection or carry over blanket approvals. Merely changing the server name does
   not establish new permission.
4. Connect the new configuration only after that review. Keep normal per-tool
   confirmations enabled and approve only `capabilities` for the first check.
5. A previous draft-only approval is never publication approval. Separately obtain
   approval for the exact listing and current rules, and save credentials privately
   before allowing `publish_free`. Allow `quote` only for a separately requested,
   non-charging quote.

These files do not edit your client settings or migrate permissions. If the client
cannot provide safe tool confirmation and private durable receipt storage, stop and
use the browser instead. Approval or account errors must not be bypassed.

## Publication procedure

1. Add the endpoint using your client's remote MCP settings. Do not overwrite
   unrelated settings or disable confirmation prompts.
2. Call capabilities and inspect current categories, free-offer dates and rules.
3. Ask for explicit approval to publish the exact public destination. A request
   for advice or a tool installation is not permission to publish.
4. Securely persist a UUIDv4 idempotency key, independent 32-byte hex submission
   secret and exact request body before calling publish_free. Only set
   credentialsSavedSecurely=true after persistence has actually succeeded.
5. Retain the private receipt safely; show only the public product URL. After an
   unknown outcome reuse identical credentials and input, not a new request.
6. Offer quote only when requested. It creates no payment or reserved rank.
   Every payment requires the customer's confirmation in Stripe.

Client tool filtering is not a server-side authorization boundary. No client may
infer approval from a configured tool. Do not use write tools in a public/shared
chat where credentials or private receipts could be disclosed.

Without HTTP/MCP execution or private durable storage, use https://bidglow.ai/
in the browser. Do not invent publication success.

## Optional Gemini CLI extension

Inspect [gemini-extension.json](./gemini-extension.json) at the repository version
you intend to install. Its name is `bidglow-publishing`, version 2.0.0, and its server
is `bidglow`. It exposes only `capabilities`, `quote` and `publish_free`. It has no
keys, local commands, hooks, context file or automatic approval setting.

After reviewing any older connections as described above, use the client's normal
interactive installation prompt:

```sh
gemini extensions install https://github.com/bidglow-ai/agent-publishing-example
```

Do not add automatic consent or automatic update flags. Inspect the effective tool
list and approval settings after installation; duplicate or same-name manual server
settings may take precedence. Do not install the extension and a duplicate manual
server. Installation is not publication approval or a passed native-client test.
Provider account eligibility and any provider usage charges remain separate.

If you choose a project-local manual configuration instead, review and merge this
entry into `.gemini/settings.json` without replacing existing settings:

```json
{
  "mcpServers": {
    "bidglow": {
      "httpUrl": "https://bidglow.ai/api/mcp",
      "includeTools": ["capabilities", "quote", "publish_free"]
    }
  }
}
```

To disconnect, remove only the extension you installed:

```sh
gemini extensions uninstall bidglow-publishing
```

For an older draft-only installation, review and remove that old extension yourself:

```sh
gemini extensions uninstall bidglow-draft-launch
```

If you used manual configuration, remove only the corresponding `bidglow` or old
`bidglow-draft` entry you added, through the same settings scope. Recheck the tool
list for duplicate connections. Retain private receipts for any listing you already
published. Removing a connection does not remove a published listing.

Official Gemini configuration references:
[extensions](https://geminicli.com/docs/extensions/reference/) and
[remote MCP](https://geminicli.com/docs/tools/mcp-server/).
Other clients have different formats; use their current remote MCP settings and
retain the same approval/storage boundaries. No client account or approval bypass
is supplied by this repository.

For a test with no production writes, download and run the isolated example:
https://bidglow.ai/examples/README.md

English is canonical. Updated October 14, 2026.
