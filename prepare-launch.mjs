// Retired compatibility entry point. Intentionally no imports or network operations.
// Never reinterpret an old draft-only command as approval to publish a real listing.
console.error('Draft generation was retired on October 8, 2026. This command made no network request, publication or payment. Review CLIENTS.md before changing any old draft-only connection. For a local simulation only, inspect and run agent-publish.mjs without arguments. Real publication requires separate explicit approval and private durable storage.');
process.exitCode = 1;
