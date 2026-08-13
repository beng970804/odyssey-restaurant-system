# Restaurant Operations Dashboard

Work through [`docs/superpowers/plans/2026-08-13-restaurant-ops-implementation.md`](docs/superpowers/plans/2026-08-13-restaurant-ops-implementation.md)
one task at a time: tests first, then implementation, then
`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`, then one conventional commit per
task. `format:check` is in that list because CI runs it and nothing else catches it. Read [`CONTEXT.md`](CONTEXT.md) before writing domain code,
and [`docs/adr/`](docs/adr/) for decisions already made.

## Where the plan has gone stale

The plan was written before the repo existed, and two of its instructions no longer match it:

- **Linting and formatting are oxlint and oxfmt**, not the ESLint and Prettier the plan's Task 1
  describes. TypeScript 7 is the reason — `typescript-eslint` hard-errors on it. The README carries
  the full account.
- **pnpm settings live in `pnpm-workspace.yaml`.** pnpm 11 ignores the `pnpm` field in
  `package.json`, so the load-bearing `zod` override would silently do nothing there.

## The generated contract

Truth flows Drizzle schema → drizzle-zod → OpenAPI → Orval → typed React Query hooks.
To change the frontend's types or hooks, change the schema or the route and run `pnpm gen:contract`
— `packages/api-client/src/generated/**` is Orval output and is regenerated wholesale (ADR 0002).

Orval's `override.query` sets `signal` only. Setting `useQuery` or `useMutation` to `true` forces
that hook kind onto _every_ operation, which generated a `useCreateMenuItem` that fired a POST on
render. Left unset, orval follows the verb.

## Gotchas that cost a debugging session each

- **Money is integer cents**, and every variable, column and field holding it ends in `Cents`.
  `formatMoney` divides by 100 at the display boundary and nowhere else.
- **`sort()` fails lint** (`unicorn(no-array-sort)`) — reach for `toSorted()`.
- **Cast SQL aggregates with `::int`.** Postgres returns `count()` and `sum()` as bigint, which
  arrives in JavaScript as a string and concatenates instead of adding.
- **Order SQL by the expression, not the output alias.** Drizzle aliases a select key verbatim, so
  `"lifetimeSpendCents"` is the column name — a snake_case alias will not resolve.
- **Timestamps cross the wire as ISO strings.** Derived select schemas swap timestamp columns to
  `isoDateTime`, and handlers pass rows through `toIsoDates`.
- **Timezone comparisons use the settings row's timezone**, never the server clock. A Worker runs in
  UTC; the restaurant does not.

## Backend conventions

- Handlers read the database from `c.get('db')`. `createApp()` stays pure so tests can bind their
  own — the env-based middleware lives only in `src/index.ts`.
- Failures throw `AppError`; the single `onError` handler renders the envelope.
- Every route sets an explicit `operationId` — it becomes the generated hook's name — and passes an
  explicit status to `c.json()`, since a route declaring an error response otherwise infers a union.
- Tests run against PGlite through `createTestDb()` and `createTestApp(db)`: no network, no Docker,
  full route stack.
