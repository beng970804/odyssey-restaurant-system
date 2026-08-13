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

| Script | What it does |
|---|---|
| `pnpm lint` | ESLint across every workspace package, via turbo |
| `pnpm typecheck` | `tsc --noEmit` across every workspace package, via turbo |
| `pnpm test` | Vitest across every workspace package, via turbo |
| `pnpm build` | Builds every workspace package, via turbo |

## Toolchain notes

**TypeScript 6, not 7.** The plan pinned TypeScript 7 (the native/Go compiler).
It installs fine, but `typescript-eslint` 8.67 hard-errors on it —
`"typescript-eslint does not support TS 7.0"` — so `pnpm lint` cannot run at all.
Tracked upstream at [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).
The plan's stated fallback was the 5.x line; TypeScript **6.0.3** is newer, is a
stable release, and sits inside typescript-eslint's supported peer range
(`>=4.8.4 <6.1.0`), so that is what is pinned. Revisit once typescript-eslint
supports TS >= 7.1.

**pnpm settings live in `pnpm-workspace.yaml`, not `package.json`.** pnpm 11 no
longer reads the `pnpm` field in `package.json`. The `zod` override is
load-bearing — `@hono/zod-openapi` only adds `.openapi()` to schemas built from
*its* zod instance, so two resolved copies of zod silently strip `.openapi()`
from every `drizzle-zod`-derived schema at runtime. Had it stayed in
`package.json` it would have been ignored, and the failure would have surfaced
as a mystery at Task 4 rather than here.

**`eslint-plugin-react-hooks` v7 moved its flat presets.** They are now under
`configs.flat['recommended-latest']`; the top-level `configs.*` entries are
eslintrc format and throw under flat config.
