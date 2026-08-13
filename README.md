# Restaurant Operations Dashboard

A staff-facing dashboard and ordering API for a single restaurant: take orders across three
channels, move them through a kitchen workflow, manage the menu and customers, and change the rules
that govern all of it from a settings page.

The frontend's types and data hooks are **generated from the database schema**, not hand-written.

## Run it locally

```bash
pnpm install
pnpm db:up                                              # docker Postgres on :5433
cp services/backend/.env.example services/backend/.dev.vars
pnpm db:migrate
pnpm db:seed                                            # 6 categories, 33 items, 15 customers, 60 orders
pnpm dev                                                # backend :8787, dashboard :8081
```

Then open `localhost:8081` for the dashboard, or `localhost:8787/reference` for the API docs.

Requirements: Node 24, pnpm 11, Docker. The test suite needs none of them — it runs Postgres
in-process via PGlite.

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
- **Native is untested.** The stack is React Native Web and the code has no web-only APIs, but it
  has only been run in a browser. Claiming iOS support without opening a simulator would be a
  claim, not a fact.
- **Order editing after placement** is not supported — only the Actions in the transition map. An
  order whose lines can change after pricing needs a revision model, which is out of scope.

## Testing

230 tests: 146 backend, 50 design system, 17 dashboard, 17 shared and types.

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
