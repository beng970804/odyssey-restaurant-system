# Restaurant Operations Dashboard

A staff-facing restaurant operations dashboard and ordering API, built as a pnpm +
Turborepo monorepo. See [`CONTEXT.md`](./CONTEXT.md) for the domain glossary,
[`docs/adr/`](./docs/adr/) for the decisions, and
[`docs/superpowers/plans/`](./docs/superpowers/plans/) for the implementation plan.

> Full documentation lands in Task 29. This file currently records only the
> toolchain deviations discovered while scaffolding.

## Requirements

- Node 24
- pnpm 11 (pnpm only — `engine-strict` is on)
- Docker, for the local Postgres fallback (`pnpm db:up`)

## Scripts

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `pnpm lint`         | oxlint across the whole repo, warnings treated as errors |
| `pnpm format`       | oxfmt, rewriting files in place                          |
| `pnpm format:check` | oxfmt in check mode — what CI runs                       |
| `pnpm typecheck`    | `tsc --noEmit` across every workspace package, via turbo |
| `pnpm test`         | Vitest across every workspace package, via turbo         |
| `pnpm build`        | Builds every workspace package, via turbo                |

## Toolchain notes

**oxlint and oxfmt, not ESLint and Prettier.** The requirements ask for a working
`pnpm lint` script; they do not specify a linter. The plan reached for ESLint by
default, and that choice turned out to have a cost: `typescript-eslint` 8.67
hard-errors on TypeScript 7 — `"typescript-eslint does not support TS 7.0"`,
tracked at [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)
— so keeping ESLint meant pinning the compiler back to TypeScript 6.

oxlint has no such coupling: it parses TypeScript itself rather than driving the
`tsc` API, so **TypeScript 7 (the native compiler) is what this repo pins.** The
two rules the plan actually depends on both exist in oxlint with identical option
shapes, and both were verified to fire before the swap was committed:

- `no-restricted-globals` banning `fetch`, with an override exempting
  `packages/api-client/src/fetcher.ts` — this is the mechanism that turns the
  brief's "no raw fetch in screens" bullet into a build failure.
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`.

Two smaller consequences. Lint is a single root-level `oxlint` run rather than a
per-package turbo task — oxlint covers the whole monorepo in milliseconds, so
per-package caching would be machinery without a payoff; `turbo.json` therefore
has no `lint` task. And oxfmt skips `docs/**` and `CONTEXT.md`
(`.oxfmtrc.json`), because those are prose artifacts that predate the tooling
and reformatting them would bury real changes in whitespace noise.

**`pnpm lint` reports "no files found" until the first package lands** in Task 2.
There is currently no TypeScript anywhere in the repo to lint. The rules were
verified against scratch files rather than assumed.

**pnpm settings live in `pnpm-workspace.yaml`, not `package.json`.** pnpm 11 no
longer reads the `pnpm` field in `package.json`. The `zod` override is
load-bearing — `@hono/zod-openapi` only adds `.openapi()` to schemas built from
_its_ zod instance, so two resolved copies of zod silently strip `.openapi()`
from every `drizzle-zod`-derived schema at runtime. Had it stayed in
`package.json` it would have been ignored, and the failure would have surfaced
as a mystery at Task 4 rather than here.
