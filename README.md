# Restaurant Operations Dashboard

A staff-facing dashboard and ordering API for a single restaurant: take orders across three
channels, move them through a kitchen workflow, manage the menu and customers, and change the rules
that govern all of it from a settings page.

It is a pnpm monorepo — a Hono API on Cloudflare Workers over Postgres, and an Expo Router
dashboard that runs in the browser **and on iOS from the same codebase**. The frontend's types and
data hooks are **generated from the database schema**, not hand-written.

## The short version

Five minutes of a reviewer's attention, spent for them:

- **One schema, zero hand-written API types.** Drizzle schema → Zod → OpenAPI → generated React
  Query hooks. CI regenerates the contract and fails on any diff, so the claim cannot rot.
- **A real order state machine.** One transition map imported by both sides — the API enforces it,
  the UI renders its buttons from it, and the tests iterate it rather than restating it. Actions
  land optimistically, with a snapshot rollback when the server refuses.
- **A hand-built design system.** Every colour, space and radius comes from tokens; a test proves
  light and dark expose identical token paths _and_ clear WCAG AA, so a half-finished dark mode
  fails the build.
- **Web, phone-sized web, and native iOS from one codebase.** Every screen adapts down to 390px
  (tables become two-line lists, the date picker stacks), and the app runs on an iPhone — with a
  platform-split chart, safe-area handling and a Hermes `Intl` fallback, each verified in a
  simulator rather than assumed.
- **Money is integer cents everywhere**, becoming dollars in exactly one place.
- **550 tests that need no Docker** — the backend suite runs real Postgres in-process (PGlite)
  through the full route stack.
- **Built with AI under machine-enforced guardrails** — tests first, contract-drift CI, a banned
  `fetch` global. The section below has the details.

## Prerequisites

| Tool       | Version     | Check with  | Get it                                                         |
| ---------- | ----------- | ----------- | -------------------------------------------------------------- |
| **Node**   | 24 or newer | `node -v`   | [nodejs.org](https://nodejs.org) or `nvm install 24`           |
| **pnpm**   | 11          | `pnpm -v`   | `corepack enable pnpm` (ships with Node 24)                    |
| **Docker** | any recent  | `docker -v` | [Docker Desktop](https://docs.docker.com/get-docker/), running |

Three things worth knowing before you start:

- **pnpm only.** `engine-strict` is on, so npm and yarn will refuse to install this workspace.
- **Docker must actually be running**, not just installed — it hosts the Postgres database.
- **Ports 5433, 8787 and 8081 must be free** (database, API, dashboard).

## Run it

From the repository root, in order:

```bash
# 1. Install dependencies for every package in the workspace
pnpm install

# 2. Start Postgres 17 in Docker, on host port 5433
pnpm db:up

# 3. Point both runtimes at that database.
#    .env      is read by the migrate/seed scripts, which run in Node.
#    .dev.vars is read by wrangler, which runs the API as a Worker.
cp services/backend/.env.example services/backend/.env
cp services/backend/.env.example services/backend/.dev.vars

# 4. Create the tables
pnpm db:migrate

# 5. Fill them with demo data — 8 categories, 70 menu items, 15 customers, 60 orders
pnpm db:seed

# 6. Start the API and the dashboard together
pnpm dev
```

Leave that last command running, then open:

| URL                                                         | What it is                    |
| ----------------------------------------------------------- | ----------------------------- |
| **[localhost:8081](http://localhost:8081)**                 | The dashboard — start here    |
| [localhost:8787/reference](http://localhost:8787/reference) | Interactive API documentation |

Steps 1–5 are one-time setup. On any later run, `pnpm db:up` and `pnpm dev` are enough.

To stop: `Ctrl-C` the dev server, then `docker compose down` to stop the database. The data survives
in a Docker volume; `docker compose down -v` deletes it too.

### Running the tests

```bash
pnpm test        # 550 tests across every package
```

The test suite needs neither Docker nor the steps above — it runs Postgres in-process via PGlite.
`pnpm typecheck`, `pnpm lint` and `pnpm format:check` are the other three commands CI runs.

### If something goes wrong

| Symptom                                      | Fix                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL is not set`                    | Step 3 was skipped — copy `.env.example` to **both** `.env` and `.dev.vars`.             |
| `Cannot connect` / `ECONNREFUSED` on migrate | Docker is not running, or `pnpm db:up` has not finished. Check with `docker ps`.         |
| Port 5433 already allocated                  | Something else holds the port. Stop it, or change the host port in `docker-compose.yml`. |
| Expo asks to use port 8082 instead           | Port 8081 is taken by another Expo instance. Close it — the dashboard expects 8081.      |
| Dashboard loads but every screen errors      | The API is not up. Check `localhost:8787/reference` responds.                            |
| Data looks duplicated after seeding twice    | `pnpm db:reset` — drops everything, re-migrates and re-seeds from scratch.               |
| `ERR_PNPM_UNSUPPORTED_ENGINE`                | Node is older than 24. `node -v`, then upgrade.                                          |

## Architecture

```
Drizzle schema  →  drizzle-zod  →  @hono/zod-openapi  →  openapi.json  →  Orval  →  typed React Query hooks
```

One definition of an Order exists, in `schema.ts`. Everything downstream is derived: the Zod
schemas that validate requests, the OpenAPI document, the TypeScript types the dashboard imports,
and the hooks it calls. There is no hand-written `interface Order` anywhere in the frontend.

**Rename a column in `schema.ts`, run `pnpm gen:contract`, and the dashboard stops typechecking.**
CI enforces this on every push — the last step regenerates the contract and fails on any diff, so
the claim cannot rot.

## Where the interesting code is

A reviewer has limited time. These four files carry the argument:

| File                                                                                 | Why                                                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [`services/backend/src/db/schema.ts`](services/backend/src/db/schema.ts)             | The source of truth. Six tables, integer cents, a check constraint that makes a second settings row impossible. |
| [`services/backend/src/services/orders.ts`](services/backend/src/services/orders.ts) | The order pipeline: nine validation steps in order, server-side pricing, one transaction.                       |
| [`packages/types/src/order-status.ts`](packages/types/src/order-status.ts)           | The transition map, imported by _both_ sides — the backend enforces it, the frontend renders buttons from it.   |
| [`packages/ui/src/theme/tokens.ts`](packages/ui/src/theme/tokens.ts)                 | Every colour, space, radius and layout dimension in the app.                                                    |

## Decisions

- [`CONTEXT.md`](CONTEXT.md) — the domain glossary. Read before writing domain code.
- [ADR 0001](docs/adr/0001-order-items-freeze-name-and-price.md) — order items freeze name and price, so
  editing the menu cannot rewrite history.
- [ADR 0002](docs/adr/0002-generated-api-contract-is-committed.md) — the generated client is committed,
  and never hand-edited.
- [ADR 0003](docs/adr/0003-postgres-access-from-cloudflare-workers.md) — two Postgres drivers behind one
  factory; the WebSocket driver because order creation needs a real transaction.
- [ADR 0004](docs/adr/0004-order-status-changes-through-action-endpoints.md) — status changes through named
  Action endpoints. There is no `PATCH /orders/:id { status }`, so it cannot be misused.

## How AI was used

The interesting part is not that AI wrote code — it is which guardrails were made **machine-enforced
rather than intended**, because an intention an agent can quietly skip is not a guardrail.

- **Documentation first.** The first commit is the glossary, spec and plan — no code. Decisions with
  their rejected alternatives were recorded as ADRs before implementation, so later work had
  something to be checked against rather than a vibe to match.
- **Tests before implementation, every task.** Each task's tests were written and watched to fail
  first. "Looks done" was never the standard.
- **Guardrails a machine checks:**
  - CI regenerates the contract and fails on any diff — the schema and the frontend cannot drift.
  - The theme test asserts light and dark expose _identical_ token paths, and that both clear WCAG
    AA contrast. A half-finished dark mode fails the build.
  - The transition tests iterate `ORDER_TRANSITIONS` rather than restating it, on both sides. Add a
    status and the suites grow themselves.
  - `no-restricted-globals` bans `fetch` outside `packages/api-client/src/fetcher.ts`, turning "no
    raw fetch in screens" from a rule into a build failure.
  - A `schema-sync` test fails if the database enum and the shared status list ever disagree.
- **Critical review of the output.** A two-axis review (repo standards, and fidelity to the spec)
  ran against the backend before the frontend started. It found two real bugs — top-selling items
  grouped by the frozen name, so renaming a dish split its sales in two; and a stale `customerId`
  surfacing as a 500 rather than a 404. Both fixes have regression tests, each confirmed to fail
  against the previous behaviour.

The commit history is the evidence: documentation first, one conventional commit per task, and the
review pass visible as its own commit.

## Trade-offs and what is incomplete

- **No authentication.** The brief scopes this to a single restaurant's staff tool. Auth would be a
  session middleware in `createApp()` and a login route; it would not change the data model, so it
  demonstrates nothing the rest of the code does not.
- **No item modifiers** (no "extra spicy", no size variants). They would be a `modifier_groups` /
  `modifiers` pair with a join onto `order_items`, and the snapshot rule from ADR 0001 would extend
  to them. Modelled but not built — it is a day of work that repeats a pattern already shown.
- **Home revenue exceeds the sum of all customers' lifetime spend, and that is correct.** Roughly a
  fifth of seeded orders are walk-ins belonging to no customer. They earn revenue but appear in no
  one's history. This reads as a bug in a demo and is stated here so it reads as a decision.
- **Native runs in Expo Go, not yet as a standalone binary.** The dashboard runs on an iPhone
  simulator: the trend chart is a platform split onto the charts library's react-native adapter
  (ADR 0005, amended), overlays mount a native `Modal` host in place of the web's body portal,
  full-height surfaces respect the safe areas, and `formatMoney` carries a fallback for the
  `formatToParts` Hermes does not implement. What remains is `expo run:ios` for an installable
  build — and Android, which has not been opened.
- **Order editing after placement** is not supported — only the Actions in the transition map. An
  order whose lines can change after pricing needs a revision model, which is out of scope.

## Testing

550 tests: 154 backend, 187 design system, 180 dashboard, 29 shared and types.

- **Backend** runs against real Postgres via PGlite — real constraints, real transactions, no Docker
  and no network. `createTestApp(db)` exercises the full route stack including validation and the
  error envelope.
- **Design system** renders React Native Web under jsdom, covering interaction states and the
  token contract.
- **Frontend** tests target the seams where a bug would be silent: the action bar against the shared
  map, and money crossing the display boundary.

The choice is targeted over exhaustive. Tests are written where a regression would be invisible or
expensive — pricing arithmetic, the state machine, timezone bucketing, contrast — rather than
spread evenly for a coverage number.

## Scripts

| Script                                               | What it does                                   |
| ---------------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                           | Backend and dashboard together                 |
| `pnpm dev:backend` / `pnpm dev:dashboard`            | One at a time                                  |
| `pnpm test`                                          | Vitest across every package                    |
| `pnpm typecheck`                                     | `tsc --noEmit` everywhere                      |
| `pnpm lint`                                          | oxlint across the repo, warnings as errors     |
| `pnpm format` / `pnpm format:check`                  | oxfmt, in place or in check mode               |
| `pnpm gen:contract`                                  | Regenerate `openapi.json` and the typed client |
| `pnpm db:up` / `db:migrate` / `db:seed` / `db:reset` | Local database lifecycle                       |

## Toolchain notes

**oxlint and oxfmt, not ESLint and Prettier.** `typescript-eslint` hard-errors on TypeScript 7
([#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)), so keeping ESLint
meant pinning the compiler back. oxlint parses TypeScript itself, so the repo runs the native
compiler. Both rules the plan depended on exist in oxlint and were verified to fire before the swap.

**pnpm settings live in `pnpm-workspace.yaml`.** pnpm 11 ignores the `pnpm` field in
`package.json`, which would have silently discarded the `zod` override — and that override is
load-bearing: two resolved copies of zod strip `.openapi()` off every derived schema at runtime.
The same file pins one React copy and sets `nodeLinker: hoisted`, without which Expo's Metro cannot
resolve packages it depends on but does not declare.
