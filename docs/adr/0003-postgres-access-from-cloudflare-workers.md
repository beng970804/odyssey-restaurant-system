# Postgres is reached over HTTP from the Worker, with a local TCP fallback

Cloudflare Workers run in `workerd`, not Node, and cannot open a raw TCP connection to Postgres the way a normal server does. The database is therefore accessed through Neon's serverless HTTP driver (`drizzle-orm/neon-http`), with a single `createDb()` factory that switches to a plain TCP driver (`postgres-js`) when an environment variable points at a local Postgres.

Neon's HTTP driver runs identically in `wrangler dev` and on a deployed Worker, so local behaviour matches production and a live demo URL is possible. The fallback exists so a reviewer with no Neon account can run `docker compose up && pnpm db:reset && pnpm dev` entirely offline. Hyperdrive, Cloudflare's native answer to the same problem, was rejected because it requires a paid plan and adds configuration surface for no benefit at this size.

## Consequences

- Both drivers are configured behind one factory; nothing above `db.ts` knows which is in use.
- The HTTP driver does not support interactive multi-statement transactions the way a TCP connection does. Order creation — the only place that genuinely needs atomicity — must use the driver's batch/transaction API rather than an open transaction handle, and is tested for atomicity explicitly.
