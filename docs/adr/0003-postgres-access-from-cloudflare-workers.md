# Postgres is reached over WebSocket/HTTP from the Worker, with a local TCP fallback

Cloudflare Workers run in `workerd`, not Node, and cannot open a standard Node `net.Socket` TCP connection to Postgres. The database is accessed using Neon's serverless WebSocket driver (`drizzle-orm/neon-serverless`), with a `createDb()` factory that switches to `postgres-js` (`drizzle-orm/postgres-js`) when `DATABASE_DRIVER === 'postgres'` or when pointing at a local Docker Postgres.

Neon's WebSocket driver (`Pool` / `WebSocket`) supports real interactive multi-statement transactions (`db.transaction(async (tx) => ...)`), ensuring atomic multi-table operations (like Order creation with Order Items) function properly on Cloudflare Workers.

## Consequences

- Both drivers are configured behind `createDb(env)`; upper application layers do not know which driver is active.
- WebSocket driver enables interactive transactions in serverless Workers without runtime limitations.
- The `postgres-js` fallback allows running `docker compose up && pnpm db:reset && pnpm dev` completely offline.
- `wrangler.toml` carries `compatibility_flags = ["nodejs_compat"]` — required by the local `postgres-js` path. Removing it breaks local development, not production, which is the confusing direction; hence this note.
- Tests never touch this factory: they run against PGlite (real Postgres in-process), which also supports transactions, so the atomicity test exercises the same code path production uses.
- Node-side scripts (migrate, seed) use a sibling `postgres-js` client, since they run in Node rather than `workerd`.
