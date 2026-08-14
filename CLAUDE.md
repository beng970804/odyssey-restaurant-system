# Restaurant Operations Dashboard

Tests first, then implementation, then
`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`, then one conventional commit per
unit of work. `format:check` is in that list because CI runs it and nothing else catches it. Read [`CONTEXT.md`](CONTEXT.md) before writing domain code,
and [`docs/adr/`](docs/adr/) for decisions already made.

[`docs/superpowers/plans/2026-08-13-restaurant-ops-implementation.md`](docs/superpowers/plans/2026-08-13-restaurant-ops-implementation.md)
is the plan this repo was built from. Tasks 1–29 are done and everything since is work the plan
never described, so read it as history: the repo, not the plan, says how things are.

## Tooling the plan predates

- **Linting and formatting are oxlint and oxfmt**, not the ESLint and Prettier the plan's Task 1
  describes. TypeScript 7 is the reason — `typescript-eslint` hard-errors on it. The README carries
  the full account.
- **pnpm settings live in `pnpm-workspace.yaml`.** pnpm 11 ignores the `pnpm` field in
  `package.json`, so the load-bearing `zod` override would silently do nothing there.

## The generated contract

Truth flows Drizzle schema → drizzle-zod → OpenAPI → Orval → typed React Query hooks.
To change the frontend's types or hooks, change the schema or the route and run `pnpm gen:contract`
— `packages/api-client/src/generated/**` is Orval output and is regenerated wholesale (ADR 0002).

Closed value lists — currencies, timezones, order channels, order statuses — live in
`packages/types/src/` and both sides import them. Backend schemas wrap them in `z.enum(...)`, so
adding a value there widens the validator, the OpenAPI enum and the frontend's chips in one edit.

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

## Frontend conventions

- Routes in `apps/dashboard/app/` are Expo Router files; the screens they render are composed from
  `apps/dashboard/src/features/<feature>/`, where the hooks, tables, drawers and forms live.
- **`fetch` is banned by lint outside `packages/api-client/src/fetcher.ts`.** Data comes from the
  generated hooks.
- **Every colour, space and radius comes from `packages/ui/src/theme/tokens.ts`** and its `dark.ts`
  twin. `tokens.test.ts` asserts both themes expose identical key paths, clear WCAG AA, and hold
  their temperature — a colour added to one mode alone fails the build.
- **Component tests are DOM tests**: React Native Web under jsdom with `@testing-library/react`, so
  `fireEvent.click` and never `press`, and every render wrapped in `ThemeProvider` (`wrap()` in
  `packages/ui/test/helpers.tsx`).
