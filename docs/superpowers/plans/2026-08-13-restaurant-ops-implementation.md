# Restaurant Operations Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a polished restaurant operations dashboard and ordering API in two days, where the frontend's types and data hooks are generated from the database schema rather than hand-written.

**Architecture:** A pnpm + Turborepo monorepo. Truth lives in the Drizzle schema; `drizzle-zod` derives Zod schemas from it; `@hono/zod-openapi` uses those to validate requests and emit an OpenAPI document; Orval turns that document into typed React Query hooks the Expo dashboard consumes. Order status changes only through named Action endpoints governed by a transition map shared by both sides.

**Tech Stack:** pnpm workspace, Turborepo, Expo (React Native Web) + Expo Router, Hono on Cloudflare Workers, PostgreSQL, Drizzle ORM, drizzle-zod, `@hono/zod-openapi`, Orval, TanStack React Query, Vitest, PGlite.

**Spec:** [`docs/superpowers/specs/2026-08-13-restaurant-ops-design.md`](../specs/2026-08-13-restaurant-ops-design.md)
**Glossary:** [`CONTEXT.md`](../../../CONTEXT.md) — read this before writing any domain code.
**Decisions:** [`docs/adr/`](../../adr/) — 0001 snapshotting, 0002 committed contract, 0003 Postgres from Workers, 0004 Action endpoints.

---

## Global Constraints

These apply to **every** task. They are not repeated per task.

- **Money is always integer cents.** Any variable, column, field or parameter holding money is named with a `Cents` suffix (`priceCents`, `subtotalCents`). No floats, no decimal strings, no exceptions.
- **No hand-written frontend types for backend data.** If a shape is persisted, the frontend imports it from `@repo/api-client`. A hand-written `interface Order` in the dashboard is a plan violation.
- **Never edit anything under `packages/api-client/src/generated/`.** It is Orval output. To change it, change the schema or the route and run `pnpm gen:contract`.
- **The order status enum and transition map are defined once**, in `packages/types`, and imported by both `services/backend` and `apps/dashboard`.
- **No raw `fetch` in screens.** Data access goes through generated hooks only.
- **Screens compose; they do not compute.** No screen file contains a conditional branching on order status, and no screen file imports a generated hook directly. Both live in feature components/hooks one layer down.
- **No literal pixel values or hex colors in `apps/dashboard`.** Everything comes from `@repo/ui` tokens.
- **Timezone:** all timestamps stored and transported as UTC ISO 8601. Opening-hours comparisons use the timezone from the settings row (`Asia/Singapore`), never the server clock's local time.
- **Currency:** single currency, `SGD`, held in settings. Tax default `9`.
- **Package manager:** pnpm only. Node 24. Commit `pnpm-lock.yaml`.
- **Commit after every task**, using conventional commit prefixes (`feat:`, `test:`, `chore:`, `docs:`).

---

## File Structure

```
CONTEXT.md                                   domain glossary
docs/adr/*.md                                decision records
docs/superpowers/{specs,plans}/              this plan and its spec
turbo.json, pnpm-workspace.yaml, package.json
docker-compose.yml                           local Postgres fallback

packages/config/                             shared tsconfig + eslint bases
packages/types/src/
  order-status.ts                            OrderStatus, ORDER_TRANSITIONS, helpers
  order-channel.ts                           OrderChannel
  index.ts
packages/shared/src/
  money.ts                                   formatMoney, sumCents, calcTaxCents
  datetime.ts                                isWithinOpeningHours, addMinutes
  index.ts
packages/api-client/
  orval.config.ts                            (lives at repo root, outputs here)
  src/generated/**                           Orval output — never hand-edited
  src/fetcher.ts                             custom Orval mutator (base URL, errors)
  src/query-client.ts                        configured QueryClient + provider
packages/ui/src/
  theme/tokens.ts                            colors, spacing, typography, radius, elevation
  theme/dark.ts                              dark token set
  theme/ThemeProvider.tsx                    context + useTheme
  primitives/*.tsx                           Button, Input, Table, Modal, …
  index.ts

services/backend/
  wrangler.toml
  openapi.json                               generated + committed
  src/db/schema.ts                           THE source of truth
  src/db/client.ts                           createDb() driver factory
  src/db/seed.ts
  src/schemas/*.ts                           drizzle-zod derivations + request schemas
  src/services/orders.ts                     order creation + transition logic
  src/services/stats.ts
  src/routes/*.ts                            one file per resource
  src/lib/errors.ts                          error envelope + AppError
  src/app.ts                                 app assembly (no server binding)
  src/index.ts                               Worker entrypoint
  scripts/generate-openapi.ts
  test/**                                    Vitest + PGlite

apps/dashboard/
  app/_layout.tsx                            providers
  app/(dashboard)/_layout.tsx                sidebar shell
  app/(dashboard)/{index,orders,menu,crm,settings}/…
  app/ui-library/index.tsx
  src/features/orders/{OrdersTable,OrderDetailDrawer,NewOrderModal,useOrderActions,useOrderFilters}.tsx
  src/features/menu/… src/features/crm/… src/features/settings/… src/features/home/…
  src/components/AppShell.tsx, Sidebar.tsx, PageHeader.tsx
```

---

## Execution order at a glance

| Block | Tasks | Target |
|---|---|---|
| A — Foundations & contract proof | 1–4 | Day 1, first 3 hours. **Do not proceed past Task 4 until the chain is proven end to end.** |
| B — Shared logic | 5–6 | Day 1 morning |
| C — Backend | 7–14 | Day 1 afternoon/evening |
| D — Design system | 15–19 | Day 1 evening → Day 2 morning |
| E — Screens | 20–25 | Day 2 |
| F — Polish & delivery | 26–30 | Day 2 evening |

**The single biggest risk in this plan is discovering on Day 2 that the Drizzle → OpenAPI → Orval chain doesn't work.** Task 4 exists solely to eliminate that risk in hour three, using one trivial endpoint, before any real feature code is written.

---

## Task 1: Monorepo skeleton

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.npmrc`
- Create: `packages/config/package.json`, `packages/config/tsconfig.base.json`, `packages/config/eslint.config.mjs`
- Create: `docker-compose.yml`

**Interfaces:**
- Produces: workspace names `@repo/config`, and the root scripts `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` delegating to turbo.

- [ ] **Step 1: Initialise the workspace root**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

Root `package.json`:
```json
{
  "name": "restaurant-ops",
  "private": true,
  "packageManager": "pnpm@11.20.0",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:backend": "pnpm --filter @repo/backend dev",
    "dev:dashboard": "pnpm --filter @repo/dashboard dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "gen:contract": "pnpm --filter @repo/backend gen:openapi && orval --config ./orval.config.ts",
    "db:up": "docker compose up -d postgres",
    "db:generate": "pnpm --filter @repo/backend db:generate",
    "db:migrate": "pnpm --filter @repo/backend db:migrate",
    "db:seed": "pnpm --filter @repo/backend db:seed",
    "db:reset": "pnpm --filter @repo/backend db:reset"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0",
    "orval": "^7.3.0",
    "prettier": "^3.4.0"
  }
}
```

- [ ] **Step 2: Configure Turborepo**

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".expo/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Create the shared config package**

`packages/config/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true
  }
}
```

`noUncheckedIndexedAccess` is deliberate: it forces you to handle `array[0]` possibly being undefined, which is exactly the class of bug that shows up in list rendering.

- [ ] **Step 4: Add the local Postgres fallback**

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: restaurant
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes: { pgdata: {} }
```

- [ ] **Step 5: Verify and commit**

Run: `pnpm install && pnpm typecheck`
Expected: install succeeds; typecheck passes trivially (no packages with source yet).

```bash
git init
git add -A
git commit -m "chore: monorepo skeleton with pnpm workspace and turborepo"
```

---

## Task 2: Backend skeleton with a working OpenAPI document

**Files:**
- Create: `services/backend/package.json`, `wrangler.toml`, `tsconfig.json`
- Create: `services/backend/src/app.ts`, `src/index.ts`, `src/lib/errors.ts`
- Create: `services/backend/scripts/generate-openapi.ts`

**Interfaces:**
- Produces: `createApp(): OpenAPIHono<{ Bindings: Env }>` from `src/app.ts`; `GET /health`; `GET /doc` serving the OpenAPI JSON; `pnpm --filter @repo/backend gen:openapi` writing `openapi.json`.

- [ ] **Step 1: Scaffold the package**

`services/backend/package.json`:
```json
{
  "name": "@repo/backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev --port 8787",
    "gen:openapi": "tsx scripts/generate-openapi.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts",
    "db:reset": "tsx src/db/reset.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/zod-openapi": "^0.18.0",
    "@scalar/hono-api-reference": "^0.5.0",
    "zod": "^3.24.0",
    "drizzle-orm": "^0.38.0",
    "drizzle-zod": "^0.6.0",
    "@neondatabase/serverless": "^0.10.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "wrangler": "^3.95.0",
    "drizzle-kit": "^0.30.0",
    "@electric-sql/pglite": "^0.2.0",
    "vitest": "^2.1.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: Write the error envelope**

`src/lib/errors.ts`:
```ts
import { z } from '@hono/zod-openapi'

export const errorSchema = z.object({
  error: z.object({
    code: z.string().openapi({ example: 'ITEM_UNAVAILABLE' }),
    message: z.string(),
    details: z.unknown().optional(),
  }),
}).openapi('Error')

export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'ITEM_UNAVAILABLE'
  | 'CHANNEL_DISABLED'
  | 'OUTSIDE_OPENING_HOURS'
  | 'INVALID_TRANSITION'

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: 400 | 404 | 409 | 422,
    readonly details?: unknown,
  ) {
    super(message)
  }
}
```

Every failure in this codebase throws `AppError`; a single Hono `onError` handler converts it to the envelope. That's why no route ever hand-builds an error response.

- [ ] **Step 3: Assemble the app**

`src/app.ts`:
```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { AppError } from './lib/errors'

export type Env = { DATABASE_URL: string; DATABASE_DRIVER?: 'neon' | 'postgres' }

export function createApp() {
  const app = new OpenAPIHono<{ Bindings: Env }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          { error: { code: 'VALIDATION_FAILED', message: 'Request validation failed', details: result.error.flatten() } },
          422,
        )
      }
    },
  })

  app.use('*', cors())

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status)
    }
    console.error(err)
    return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500)
  })

  app.doc('/doc', {
    openapi: '3.1.0',
    info: { title: 'Restaurant Operations API', version: '1.0.0' },
  })
  app.get('/reference', apiReference({ spec: { url: '/doc' } }))

  return app
}
```

The `defaultHook` is important: it makes *every* route's validation failure return the same envelope automatically, rather than each route remembering to handle it.

- [ ] **Step 4: Add the health route and Worker entrypoint**

`src/index.ts`:
```ts
import { createApp } from './app'
import { registerHealthRoutes } from './routes/health'

const app = createApp()
registerHealthRoutes(app)
export default app
```

`src/routes/health.ts`:
```ts
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import type { Env } from '../app'

const healthSchema = z.object({ status: z.literal('ok') }).openapi('Health')

export function registerHealthRoutes(app: OpenAPIHono<{ Bindings: Env }>) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      operationId: 'getHealth',
      tags: ['System'],
      responses: {
        200: { description: 'Service is healthy', content: { 'application/json': { schema: healthSchema } } },
      },
    }),
    (c) => c.json({ status: 'ok' as const }),
  )
}
```

`operationId` is not optional decoration — Orval uses it to name the generated hook. `getHealth` becomes `useGetHealth()`. Set it explicitly on every route or you get machine-generated names.

- [ ] **Step 5: Write the OpenAPI generator script**

`scripts/generate-openapi.ts`:
```ts
import { writeFileSync } from 'node:fs'
import { createApp } from '../src/app'
import { registerAllRoutes } from '../src/routes'

const app = createApp()
registerAllRoutes(app)
const doc = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'Restaurant Operations API', version: '1.0.0' },
})
writeFileSync(new URL('../openapi.json', import.meta.url), JSON.stringify(doc, null, 2) + '\n')
console.log('wrote openapi.json')
```

Create `src/routes/index.ts` exporting `registerAllRoutes(app)` which calls each register function. Every new route file gets added there and to `src/index.ts` via the same function — one registration point, so the served API and the generated document can never diverge.

- [ ] **Step 6: Verify and commit**

Run: `pnpm --filter @repo/backend gen:openapi && pnpm dev:backend`
Expected: `openapi.json` written containing `/health`; `curl localhost:8787/health` returns `{"status":"ok"}`; `localhost:8787/reference` renders the API docs page.

```bash
git add -A && git commit -m "feat(backend): hono skeleton with openapi document generation"
```

---

## Task 3: Database schema and driver factory

**Files:**
- Create: `services/backend/src/db/schema.ts`, `src/db/client.ts`, `src/db/migrate.ts`, `src/db/reset.ts`, `drizzle.config.ts`
- Create: `services/backend/.env.example`

**Interfaces:**
- Produces: all six tables; `createDb(env: Env): Db`; `type Db = ReturnType<typeof createDb>`.
- Consumes: `Env` from Task 2.

- [ ] **Step 1: Write the schema**

`src/db/schema.ts` — this file is the source of truth for the entire system:
```ts
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, serial, index, check } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const orderStatusValues = ['pending','accepted','preparing','ready','completed','cancelled'] as const
export const orderChannelValues = ['dine_in','takeaway','delivery'] as const

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('menu_items_category_idx').on(t.categoryId),
  check('menu_items_price_non_negative', sql`${t.priceCents} >= 0`),
])

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: serial('order_number').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  channel: text('channel', { enum: orderChannelValues }).notNull(),
  status: text('status', { enum: orderStatusValues }).notNull().default('pending'),
  subtotalCents: integer('subtotal_cents').notNull(),
  taxCents: integer('tax_cents').notNull(),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  estimatedReadyAt: timestamp('estimated_ready_at', { withTimezone: true }),
  placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('orders_status_idx').on(t.status),
  index('orders_placed_at_idx').on(t.placedAt),
  index('orders_customer_idx').on(t.customerId),
])

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id),
  nameSnapshot: text('name_snapshot').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
}, (t) => [
  index('order_items_order_idx').on(t.orderId),
  check('order_items_quantity_positive', sql`${t.quantity} > 0`),
])

export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  defaultPrepTimeMinutes: integer('default_prep_time_minutes').notNull().default(20),
  autoAcceptOrders: boolean('auto_accept_orders').notNull().default(false),
  dineInEnabled: boolean('dine_in_enabled').notNull().default(true),
  takeawayEnabled: boolean('takeaway_enabled').notNull().default(true),
  deliveryEnabled: boolean('delivery_enabled').notNull().default(true),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(400),
  taxRatePercent: integer('tax_rate_percent').notNull().default(9),
  currency: text('currency').notNull().default('SGD'),
  timezone: text('timezone').notNull().default('Asia/Singapore'),
  openingHours: jsonb('opening_hours').$type<OpeningHours>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check('settings_singleton', sql`${t.id} = 1`)])

export type OpeningHours = Record<
  'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun',
  { closed: true } | { closed?: false; open: string; close: string }
>

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}))
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}))
export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
}))
export const categoriesRelations = relations(categories, ({ many }) => ({ items: many(menuItems) }))
export const customersRelations = relations(customers, ({ many }) => ({ orders: many(orders) }))
```

Note `check('settings_singleton', sql\`id = 1\`)` — the database itself refuses a second settings row. Enforcing a rule in the schema rather than in application code means it holds even against a mistaken seed script.

- [ ] **Step 2: Write the driver factory (ADR 0003)**

`src/db/client.ts`:
```ts
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import type { Env } from '../app'

export function createDb(env: Env) {
  // Local development points DATABASE_URL at docker Postgres; production uses Neon.
  // Both expose the same Drizzle API, so nothing above this file knows the difference.
  return drizzleNeon(neon(env.DATABASE_URL), { schema })
}
export type Db = ReturnType<typeof createDb>
```

For the Node-side scripts (migrate, seed, tests) create a sibling `src/db/node-client.ts` using `drizzle-orm/postgres-js`, because those run in Node, not in the Worker.

- [ ] **Step 3: Generate and apply the first migration**

Run:
```bash
pnpm db:up
pnpm db:generate      # writes services/backend/drizzle/0000_*.sql
pnpm db:migrate
```
Expected: six tables exist. Verify with `docker compose exec postgres psql -U postgres -d restaurant -c '\dt'`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(backend): drizzle schema, migrations and driver factory"
```

---

## Task 4: Prove the contract chain end to end ⚠️ GATE

**This task builds no product features. Its only job is to prove the generation pipeline works before two days of code depend on it.**

**Files:**
- Create: `orval.config.ts` (repo root)
- Create: `packages/api-client/package.json`, `src/fetcher.ts`, `src/query-client.tsx`, `src/index.ts`
- Create: `services/backend/src/schemas/categories.ts`, `src/routes/categories.ts` (read-only, one endpoint)
- Modify: `services/backend/src/routes/index.ts`

**Interfaces:**
- Produces: `pnpm gen:contract`; `@repo/api-client` exporting `useListCategories`, generated `Category` type, `ApiProvider`.
- Consumes: `createDb` (Task 3), `createApp` (Task 2).

- [ ] **Step 1: Derive Zod schemas from the Drizzle table**

`src/schemas/categories.ts`:
```ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { categories } from '../db/schema'
import { z } from '@hono/zod-openapi'

export const categorySchema = createSelectSchema(categories).openapi('Category')
export const createCategorySchema = createInsertSchema(categories, {
  name: (s) => s.min(1, 'Name is required'),
}).pick({ name: true, sortOrder: true }).openapi('CreateCategory')

export const categoryListSchema = z.object({
  data: z.array(categorySchema),
  meta: z.object({ total: z.number().int() }),
}).openapi('CategoryList')
```

This is the drizzle-zod link. `categorySchema` was never hand-written — it is the `categories` table, converted. Add a column to the table and it appears here, in the OpenAPI document, and in the frontend type, without touching this file.

- [ ] **Step 2: Add one route using it**

`src/routes/categories.ts`:
```ts
import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { asc } from 'drizzle-orm'
import { categories } from '../db/schema'
import { createDb } from '../db/client'
import { categoryListSchema } from '../schemas/categories'
import { errorSchema } from '../lib/errors'
import type { Env } from '../app'

export function registerCategoryRoutes(app: OpenAPIHono<{ Bindings: Env }>) {
  app.openapi(
    createRoute({
      method: 'get', path: '/categories', operationId: 'listCategories', tags: ['Menu'],
      responses: {
        200: { description: 'All categories', content: { 'application/json': { schema: categoryListSchema } } },
        500: { description: 'Error', content: { 'application/json': { schema: errorSchema } } },
      },
    }),
    async (c) => {
      const db = createDb(c.env)
      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
      return c.json({ data: rows, meta: { total: rows.length } })
    },
  )
}
```

- [ ] **Step 3: Configure Orval**

`orval.config.ts` at the repo root:
```ts
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './services/backend/openapi.json',
    output: {
      mode: 'tags-split',
      target: './packages/api-client/src/generated/endpoints',
      schemas: './packages/api-client/src/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      prettier: true,
      override: {
        mutator: { path: './packages/api-client/src/fetcher.ts', name: 'customFetch' },
        query: { useQuery: true, useMutation: true, signal: true },
      },
    },
  },
})
```

`mode: 'tags-split'` groups generated hooks by the OpenAPI `tags` you set on each route, so the output is navigable rather than one enormous file. The `mutator` makes every generated call route through your own fetch wrapper.

- [ ] **Step 4: Write the fetcher (the one place `fetch` is allowed)**

`packages/api-client/src/fetcher.ts`:
```ts
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown) {
    super(message)
  }
}

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787'

export async function customFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: { code: string; message: string; details?: unknown } } | null
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText, body?.error?.details)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
```

Unwrapping the error envelope here means every screen gets a typed `ApiError` with a `code` it can branch on, instead of each component parsing response bodies.

- [ ] **Step 5: Run the chain and verify the gate**

Run: `pnpm gen:contract`
Expected: `services/backend/openapi.json` contains `listCategories`; `packages/api-client/src/generated/endpoints/menu/menu.ts` exports `useListCategories`.

**Now prove it's live, not decorative:**
1. In `schema.ts`, rename `categories.sortOrder` → `categories.displayOrder`.
2. Run `pnpm gen:contract`.
3. Confirm the generated `Category` model's field changed too.
4. Revert both.

If the generated type did not change, stop and fix the pipeline before doing anything else. Everything after this task assumes this works.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: drizzle-zod to openapi to orval contract chain, proven end to end"
```

---

## Task 5: Shared order status and transition map

**Files:**
- Create: `packages/types/package.json`, `src/order-status.ts`, `src/order-channel.ts`, `src/index.ts`
- Test: `packages/types/test/order-status.test.ts`

**Interfaces:**
- Produces: `OrderStatus`, `OrderAction`, `ORDER_TRANSITIONS`, `getAvailableActions(status): OrderAction[]`, `canPerform(status, action): boolean`, `resolveTransition(status, action): OrderStatus | null`, `ORDER_STATUS_LABELS`, `ORDER_STATUS_TONE`.
- Consumed by: the backend's transition enforcement (Task 12) and the dashboard's action buttons (Task 21).

- [ ] **Step 1: Write the failing test**

`packages/types/test/order-status.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ORDER_TRANSITIONS, getAvailableActions, canPerform, resolveTransition, ORDER_STATUSES } from '../src/order-status'

describe('order transitions', () => {
  it('allows accept and cancel from pending', () => {
    expect(getAvailableActions('pending').sort()).toEqual(['accept', 'cancel'])
  })

  it('does not allow cancelling a ready order', () => {
    expect(canPerform('ready', 'cancel')).toBe(false)
    expect(getAvailableActions('ready')).toEqual(['complete'])
  })

  it('treats completed and cancelled as terminal', () => {
    expect(getAvailableActions('completed')).toEqual([])
    expect(getAvailableActions('cancelled')).toEqual([])
  })

  it('resolves the destination status for a legal action', () => {
    expect(resolveTransition('preparing', 'markReady')).toBe('ready')
  })

  it('returns null for an illegal action', () => {
    expect(resolveTransition('pending', 'complete')).toBeNull()
  })

  it('every status is reachable in the map', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @repo/types test`
Expected: FAIL — module `../src/order-status` not found.

- [ ] **Step 3: Implement**

`packages/types/src/order-status.ts`:
```ts
export const ORDER_STATUSES = ['pending','accepted','preparing','ready','completed','cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_ACTIONS = ['accept','startPreparing','markReady','complete','cancel'] as const
export type OrderAction = (typeof ORDER_ACTIONS)[number]

export const ORDER_TRANSITIONS: Record<OrderStatus, Partial<Record<OrderAction, OrderStatus>>> = {
  pending:   { accept: 'accepted', cancel: 'cancelled' },
  accepted:  { startPreparing: 'preparing', cancel: 'cancelled' },
  preparing: { markReady: 'ready', cancel: 'cancelled' },
  ready:     { complete: 'completed' },
  completed: {},
  cancelled: {},
}

export function getAvailableActions(status: OrderStatus): OrderAction[] {
  return Object.keys(ORDER_TRANSITIONS[status]) as OrderAction[]
}
export function canPerform(status: OrderStatus, action: OrderAction): boolean {
  return action in ORDER_TRANSITIONS[status]
}
export function resolveTransition(status: OrderStatus, action: OrderAction): OrderStatus | null {
  return ORDER_TRANSITIONS[status][action] ?? null
}

export const ORDER_ACTION_LABELS: Record<OrderAction, string> = {
  accept: 'Accept', startPreparing: 'Start preparing', markReady: 'Mark ready',
  complete: 'Complete', cancel: 'Cancel',
}
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
  ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
}
export const ORDER_STATUS_TONE: Record<OrderStatus, 'neutral'|'info'|'warning'|'success'|'danger'> = {
  pending: 'warning', accepted: 'info', preparing: 'info',
  ready: 'success', completed: 'neutral', cancelled: 'danger',
}
```

`ORDER_STATUS_TONE` maps a domain concept to a *design system* concept, not to a colour. The Badge takes a tone; the theme decides what a tone looks like. That's what keeps the primitive free of business knowledge.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @repo/types test`
Expected: PASS, 6 tests.

- [ ] **Step 5: Assert the schema and the shared type agree**

Add to the backend test suite later (Task 11 setup), but write the guard now in `packages/types/test/order-status.test.ts` is not possible (no dependency). Instead add to `services/backend/test/schema-sync.test.ts`:
```ts
import { expect, it } from 'vitest'
import { orderStatusValues } from '../src/db/schema'
import { ORDER_STATUSES } from '@repo/types'

it('database status enum matches the shared status list', () => {
  expect([...orderStatusValues].sort()).toEqual([...ORDER_STATUSES].sort())
})
```
This is the tripwire that catches the two definitions drifting apart.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(types): shared order status enum and transition map"
```

---

## Task 6: Shared money and datetime utilities

**Files:**
- Create: `packages/shared/package.json`, `src/money.ts`, `src/datetime.ts`, `src/index.ts`
- Test: `packages/shared/test/money.test.ts`, `test/datetime.test.ts`

**Interfaces:**
- Produces: `formatMoney(cents, currency)`, `calcTaxCents(subtotalCents, ratePercent)`, `sumCents(values)`, `isWithinOpeningHours(date, hours, timezone)`, `addMinutes(date, n)`.

- [ ] **Step 1: Write the failing tests**

`packages/shared/test/money.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatMoney, calcTaxCents, sumCents } from '../src/money'

describe('formatMoney', () => {
  it('formats cents as currency', () => {
    expect(formatMoney(2602, 'SGD')).toBe('S$26.02')
  })
  it('formats zero', () => {
    expect(formatMoney(0, 'SGD')).toBe('S$0.00')
  })
})

describe('calcTaxCents', () => {
  it('rounds to the nearest cent', () => {
    // 2020 * 0.09 = 181.8 -> 182 (the spec's worked example)
    expect(calcTaxCents(2020, 9)).toBe(182)
  })
  it('rounds half up', () => {
    expect(calcTaxCents(1000, 5)).toBe(50)
    expect(calcTaxCents(50, 9)).toBe(5) // 4.5 -> 5
  })
  it('returns zero for a zero rate', () => {
    expect(calcTaxCents(2020, 0)).toBe(0)
  })
})

describe('sumCents', () => {
  it('sums a list', () => {
    expect(sumCents([1700, 320])).toBe(2020)
  })
})
```

`packages/shared/test/datetime.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isWithinOpeningHours } from '../src/datetime'
import type { OpeningHours } from '../src/datetime'

const hours: OpeningHours = {
  mon: { open: '11:00', close: '22:00' }, tue: { open: '11:00', close: '22:00' },
  wed: { open: '11:00', close: '22:00' }, thu: { open: '11:00', close: '22:00' },
  fri: { open: '11:00', close: '23:00' }, sat: { open: '11:00', close: '23:00' },
  sun: { closed: true },
}

describe('isWithinOpeningHours', () => {
  it('accepts a time inside the window, in the restaurant timezone', () => {
    // 2026-08-13 is a Thursday. 06:00 UTC = 14:00 in Singapore.
    expect(isWithinOpeningHours(new Date('2026-08-13T06:00:00Z'), hours, 'Asia/Singapore')).toBe(true)
  })
  it('rejects a time before opening', () => {
    // 01:00 UTC = 09:00 Singapore, before the 11:00 open
    expect(isWithinOpeningHours(new Date('2026-08-13T01:00:00Z'), hours, 'Asia/Singapore')).toBe(false)
  })
  it('rejects a closed day', () => {
    // 2026-08-16 is a Sunday
    expect(isWithinOpeningHours(new Date('2026-08-16T06:00:00Z'), hours, 'Asia/Singapore')).toBe(false)
  })
})
```

The UTC-vs-local case is the whole reason this function exists. A Worker's clock is UTC; a restaurant's hours are local. Getting this wrong means the API refuses orders for eight hours a day and nobody notices until a demo.

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @repo/shared test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`packages/shared/src/money.ts`:
```ts
export function formatMoney(cents: number, currency = 'SGD', locale = 'en-SG'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
export function calcTaxCents(subtotalCents: number, ratePercent: number): number {
  return Math.round((subtotalCents * ratePercent) / 100)
}
export function sumCents(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
```

`formatMoney` divides by 100 *only at the display boundary*. That division is the single place a cent value becomes a dollar value in the entire system.

`packages/shared/src/datetime.ts`:
```ts
export type DayKey = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'
export type OpeningHours = Record<DayKey, { closed: true } | { closed?: false; open: string; close: string }>

const DAY_KEYS: DayKey[] = ['sun','mon','tue','wed','thu','fri','sat']

/** Returns the weekday key and HH:mm for `date` as seen in `timeZone`. */
function localParts(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  const weekdayIndex = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday!)
  const hour = Number(parts.hour === '24' ? '00' : parts.hour)
  return { day: DAY_KEYS[weekdayIndex]!, minutes: hour * 60 + Number(parts.minute) }
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h! * 60 + m!
}

export function isWithinOpeningHours(date: Date, hours: OpeningHours, timeZone: string): boolean {
  const { day, minutes } = localParts(date, timeZone)
  const today = hours[day]
  if (!today || today.closed) return false
  return minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)
}

export function addMinutes(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 60_000)
}
```

`Intl.DateTimeFormat` is used rather than a date library because it works identically in Node, the browser, and `workerd`, with no dependency.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @repo/shared test`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(shared): money and opening-hours utilities"
```

---

## Task 7: Test harness and seed data

**Files:**
- Create: `services/backend/test/helpers/db.ts`, `test/helpers/app.ts`, `vitest.config.ts`
- Create: `services/backend/src/db/seed.ts`, `src/db/seed-data.ts`, `src/db/reset.ts`

**Interfaces:**
- Produces: `createTestDb(): Promise<{ db, cleanup }>` (PGlite, migrated, empty), `createTestApp(db)` returning a Hono app bound to that db, `seed(db)`.
- Consumed by: every backend test from Task 11 onward.

- [ ] **Step 1: Build the PGlite test database helper**

`test/helpers/db.ts`:
```ts
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../../src/db/schema'

export async function createTestDb() {
  const client = new PGlite()                    // in-memory Postgres, fresh per call
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })
  return { db, cleanup: () => client.close() }
}
export type TestDb = Awaited<ReturnType<typeof createTestDb>>['db']
```

PGlite is real Postgres compiled to WebAssembly. Constraints, transactions and SQL behave exactly as in production, but there is no Docker to install and each test file gets a pristine database in milliseconds.

- [ ] **Step 2: Make the app testable by injecting the db**

Refactor route registration so handlers obtain the db from `c.get('db')`, set by middleware, rather than calling `createDb(c.env)` directly:

`src/app.ts` addition:
```ts
export type Vars = { db: Db }
// in createApp():
app.use('*', async (c, next) => {
  if (!c.get('db')) c.set('db', createDb(c.env))
  await next()
})
```
`test/helpers/app.ts`:
```ts
import { createApp } from '../../src/app'
import { registerAllRoutes } from '../../src/routes'
import type { TestDb } from './db'

export function createTestApp(db: TestDb) {
  const app = createApp()
  app.use('*', async (c, next) => { c.set('db', db as never); await next() })
  registerAllRoutes(app)
  return app
}
```
Tests then call `app.request('/orders', { method: 'POST', body })` — no network, no server, full route stack including validation.

- [ ] **Step 3: Write the deterministic seed**

`src/db/seed-data.ts` holds literal arrays: 6 categories, ~30 menu items with real dish names and prices in cents (3 of them `isAvailable: false`), 15 customers.

`src/db/seed.ts` generates orders with a seeded PRNG so runs are identical:
```ts
// Mulberry32 — small deterministic PRNG. Same seed, same restaurant, every time.
function makeRng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```
Generate ~60 orders spread over the last 30 days (`placedAt` relative to now), distributed across statuses (weighted toward `completed`), all three channels, ~20% walk-ins (`customerId: null`), and 4 cancelled orders with reasons. **Money on seeded orders must be computed with the same `calcTaxCents` the API uses** — importing the real function, not duplicating the arithmetic — so seeded data is indistinguishable from data the API would produce.

Insert the singleton settings row with the opening hours from Task 6's test fixture.

- [ ] **Step 4: Verify the seed**

Run: `pnpm db:reset`
Expected: console summary — `6 categories, 30 menu items, 15 customers, 60 orders`. Spot check in psql that `SELECT status, count(*) FROM orders GROUP BY status` shows every status represented.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(backend): pglite test harness and deterministic seed data"
```

---

## Task 8: Menu endpoints (categories and items)

**Files:**
- Create: `services/backend/src/schemas/menu.ts`, `src/routes/menu.ts`
- Modify: `services/backend/src/routes/categories.ts` (extend to full CRUD), `src/routes/index.ts`
- Test: `services/backend/test/menu.test.ts`

**Interfaces:**
- Produces: `listCategories`, `createCategory`, `updateCategory`, `listMenuItems`, `createMenuItem`, `updateMenuItem`, `archiveMenuItem` — these `operationId`s become `useListMenuItems`, `useCreateMenuItem`, etc.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/db'
import { createTestApp } from './helpers/app'
import { seed } from '../src/db/seed'

describe('menu items', () => {
  let app: ReturnType<typeof createTestApp>
  beforeEach(async () => {
    const { db } = await createTestDb()
    await seed(db)
    app = createTestApp(db)
  })

  it('filters by availability', async () => {
    const res = await app.request('/menu-items?available=true')
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.every((i: { isAvailable: boolean }) => i.isAvailable)).toBe(true)
  })

  it('rejects a negative price', async () => {
    const res = await app.request('/menu-items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Free lunch', categoryId: '00000000-0000-0000-0000-000000000000', priceCents: -1 }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('VALIDATION_FAILED')
  })

  it('archives rather than deletes', async () => {
    const list = await (await app.request('/menu-items')).json()
    const id = list.data[0].id
    const res = await app.request(`/menu-items/${id}/archive`, { method: 'POST' })
    expect(res.status).toBe(200)
    const after = await (await app.request('/menu-items')).json()
    expect(after.data.find((i: { id: string }) => i.id === id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @repo/backend test menu`
Expected: FAIL — 404s, routes don't exist.

- [ ] **Step 3: Implement the schemas and routes**

`src/schemas/menu.ts` derives from the tables exactly as Task 4 did:
```ts
export const menuItemSchema = createSelectSchema(menuItems).openapi('MenuItem')
export const createMenuItemSchema = createInsertSchema(menuItems, {
  name: (s) => s.min(1),
  priceCents: (s) => s.int().nonnegative(),
}).pick({ categoryId: true, name: true, description: true, priceCents: true, isAvailable: true, imageUrl: true })
  .openapi('CreateMenuItem')
export const updateMenuItemSchema = createMenuItemSchema.partial().openapi('UpdateMenuItem')
export const menuItemListSchema = z.object({
  data: z.array(menuItemSchema.extend({ categoryName: z.string() })),
  meta: z.object({ total: z.number().int() }),
}).openapi('MenuItemList')
```

`createInsertSchema`'s second argument refines the derived schema — the base types come from the table, the business rules are layered on. That's the pattern for every resource.

Routes follow Task 4's shape. `listMenuItems` accepts `categoryId`, `available`, `search`, joins the category name, and excludes archived items unless `includeArchived=true`. `archiveMenuItem` sets `isArchived = true` (ADR 0001 — never a hard delete).

- [ ] **Step 4: Run tests, then regenerate the contract**

Run: `pnpm --filter @repo/backend test menu` → PASS
Run: `pnpm gen:contract`
Expected: `useListMenuItems`, `useCreateMenuItem`, `useArchiveMenuItem` appear in the generated client.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(backend): menu category and item endpoints"
```

---

## Task 9: Customer endpoints with aggregates

**Files:**
- Create: `services/backend/src/schemas/customers.ts`, `src/routes/customers.ts`, `src/services/customers.ts`
- Test: `services/backend/test/customers.test.ts`

**Interfaces:**
- Produces: `listCustomers` (with `orderCount`, `lifetimeSpendCents`), `getCustomer` (with `recentOrders`), `createCustomer`, `updateCustomer`.

- [ ] **Step 1: Write the failing test**

```ts
it('computes lifetime spend excluding cancelled orders', async () => {
  const res = await app.request('/customers')
  const body = await res.json()
  const withOrders = body.data.find((c: { orderCount: number }) => c.orderCount > 0)
  expect(withOrders.lifetimeSpendCents).toBeGreaterThan(0)

  // cross-check against the raw orders for that customer
  const detail = await (await app.request(`/customers/${withOrders.id}`)).json()
  const expected = detail.recentOrders
    .filter((o: { status: string }) => o.status !== 'cancelled')
    .reduce((sum: number, o: { totalCents: number }) => sum + o.totalCents, 0)
  expect(withOrders.lifetimeSpendCents).toBeGreaterThanOrEqual(expected)
})
```

- [ ] **Step 2: Run it and watch it fail** — `pnpm --filter @repo/backend test customers` → FAIL (404).

- [ ] **Step 3: Implement the aggregate query**

`src/services/customers.ts`:
```ts
export async function listCustomers(db: Db, search?: string) {
  return db
    .select({
      id: customers.id, name: customers.name, phone: customers.phone,
      email: customers.email, notes: customers.notes, createdAt: customers.createdAt,
      orderCount: sql<number>`count(${orders.id})::int`,
      lifetimeSpendCents: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)::int`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(search ? ilike(customers.name, `%${search}%`) : undefined)
    .groupBy(customers.id)
    .orderBy(desc(sql`lifetime_spend_cents`))
}
```

The `::int` casts matter: Postgres returns `count()` and `sum()` as bigint, which arrives in JavaScript as a **string**. Without the cast, `lifetimeSpendCents` reaches the frontend as `"4820"` and every calculation silently concatenates. This is the same class of problem that ruled out `numeric` for prices.

The response schema for these computed fields is hand-written Zod extending the derived `customerSchema` — that's legitimate, because `orderCount` is a query result, not a column.

- [ ] **Step 4: Run tests, regenerate contract, commit**

```bash
pnpm --filter @repo/backend test customers && pnpm gen:contract
git add -A && git commit -m "feat(backend): customer endpoints with order count and lifetime spend"
```

---

## Task 10: Settings endpoints

**Files:**
- Create: `services/backend/src/schemas/settings.ts`, `src/routes/settings.ts`, `src/services/settings.ts`
- Test: `services/backend/test/settings.test.ts`

**Interfaces:**
- Produces: `getSettings`, `updateSettings`; `getSettings(db): Promise<Settings>` service function used by the order pipeline in Task 11.

- [ ] **Step 1: Write the failing tests**

```ts
it('returns the singleton settings row', async () => {
  const res = await app.request('/settings')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.currency).toBe('SGD')
  expect(body.taxRatePercent).toBe(9)
})

it('rejects a tax rate above 100', async () => {
  const res = await app.request('/settings', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taxRatePercent: 150 }),
  })
  expect(res.status).toBe(422)
})

it('rejects opening hours with a malformed time', async () => {
  const res = await app.request('/settings', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ openingHours: { mon: { open: '25:00', close: '22:00' } } }),
  })
  expect(res.status).toBe(422)
})
```

- [ ] **Step 2: Run and watch fail.**

- [ ] **Step 3: Implement**

The opening-hours Zod schema needs writing by hand because it validates the *inside* of a `jsonb` column, which drizzle-zod types only as `unknown`:
```ts
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm')
const dayHoursSchema = z.union([
  z.object({ closed: z.literal(true) }),
  z.object({ closed: z.literal(false).optional(), open: timeString, close: timeString })
    .refine((d) => d.open < d.close, { message: 'Opening time must be before closing time' }),
])
export const openingHoursSchema = z.object({
  mon: dayHoursSchema, tue: dayHoursSchema, wed: dayHoursSchema, thu: dayHoursSchema,
  fri: dayHoursSchema, sat: dayHoursSchema, sun: dayHoursSchema,
}).openapi('OpeningHours')
```
`updateSettings` is `PATCH`, always targeting `id = 1`, always setting `updatedAt`.

- [ ] **Step 4: Run tests, regenerate contract, commit**

```bash
pnpm --filter @repo/backend test settings && pnpm gen:contract
git add -A && git commit -m "feat(backend): settings endpoints with opening hours validation"
```

---

## Task 11: Order creation pipeline ⭐ core task

**Files:**
- Create: `services/backend/src/services/orders.ts`, `src/schemas/orders.ts`
- Create: `services/backend/src/routes/orders.ts` (create only; list/detail in Task 13)
- Test: `services/backend/test/order-create.test.ts`

**Interfaces:**
- Produces: `createOrder(db, input): Promise<OrderDetail>`; `POST /orders` → `operationId: createOrder` → `useCreateOrder()`.
- Consumes: `getSettings` (Task 10), `calcTaxCents` / `isWithinOpeningHours` / `addMinutes` (Task 6).

This implements spec §6 step by step. Read that section before starting.

- [ ] **Step 1: Write the failing tests — all nine**

`test/order-create.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createTestDb } from './helpers/db'
import { createTestApp } from './helpers/app'
import { seedMinimal } from './helpers/fixtures'

// Fix "now" to Thursday 14:00 Singapore, inside opening hours.
const NOW = new Date('2026-08-13T06:00:00Z')

describe('POST /orders', () => {
  let app: ReturnType<typeof createTestApp>
  let fixtures: Awaited<ReturnType<typeof seedMinimal>>

  beforeEach(async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    const { db } = await createTestDb()
    fixtures = await seedMinimal(db)   // nasiLemak @ 850, tehTarik @ 320, soldOut item, settings tax 9%, delivery fee 400
    app = createTestApp(db)
  })
  afterEach(() => vi.useRealTimers())

  const post = (body: unknown) =>
    app.request('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

  it('computes subtotal, tax and total server-side (spec §5.3)', async () => {
    const res = await post({
      channel: 'delivery',
      items: [{ menuItemId: fixtures.nasiLemak.id, quantity: 2 }, { menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(201)
    const order = await res.json()
    expect(order.subtotalCents).toBe(2020)
    expect(order.taxCents).toBe(182)
    expect(order.deliveryFeeCents).toBe(400)
    expect(order.totalCents).toBe(2602)
  })

  it('ignores prices supplied by the client', async () => {
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.nasiLemak.id, quantity: 1, unitPriceCents: 1, totalCents: 1 }],
    })
    const order = await res.json()
    expect(order.subtotalCents).toBe(850)          // not 1
    expect(order.items[0].unitPriceCents).toBe(850)
  })

  it('charges no delivery fee for non-delivery channels', async () => {
    const res = await post({ channel: 'dine_in', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    expect((await res.json()).deliveryFeeCents).toBe(0)
  })

  it('rejects an unavailable menu item, naming it', async () => {
    const res = await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.soldOut.id, quantity: 1 }] })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('ITEM_UNAVAILABLE')
    expect(body.error.details.unavailableItems[0].name).toBe(fixtures.soldOut.name)
  })

  it('rejects a disabled channel', async () => {
    await fixtures.setSettings({ deliveryEnabled: false })
    const res = await post({ channel: 'delivery', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('CHANNEL_DISABLED')
  })

  it('rejects an order placed outside opening hours', async () => {
    vi.setSystemTime(new Date('2026-08-13T01:00:00Z'))   // 09:00 Singapore, opens 11:00
    const res = await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('OUTSIDE_OPENING_HOURS')
  })

  it('honours auto-accept', async () => {
    await fixtures.setSettings({ autoAcceptOrders: true })
    const res = await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    expect((await res.json()).status).toBe('accepted')
  })

  it('defaults to pending when auto-accept is off', async () => {
    const res = await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    expect((await res.json()).status).toBe('pending')
  })

  it('sets estimated ready time from the prep-time setting', async () => {
    await fixtures.setSettings({ defaultPrepTimeMinutes: 25 })
    const res = await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }] })
    const order = await res.json()
    expect(new Date(order.estimatedReadyAt).toISOString()).toBe(new Date(NOW.getTime() + 25 * 60_000).toISOString())
  })

  it('freezes the item name and price (ADR 0001)', async () => {
    const created = await (await post({ channel: 'takeaway', items: [{ menuItemId: fixtures.nasiLemak.id, quantity: 1 }] })).json()
    await fixtures.setMenuItemPrice(fixtures.nasiLemak.id, 1200)
    const refetched = await (await app.request(`/orders/${created.id}`)).json()
    expect(refetched.items[0].unitPriceCents).toBe(850)   // unchanged
    expect(refetched.totalCents).toBe(created.totalCents)
  })

  it('rejects an empty item list', async () => {
    const res = await post({ channel: 'takeaway', items: [] })
    expect(res.status).toBe(422)
  })

  it('writes nothing when an item is unavailable (atomicity)', async () => {
    const before = await (await app.request('/orders')).json()
    await post({ channel: 'takeaway', items: [
      { menuItemId: fixtures.nasiLemak.id, quantity: 1 },
      { menuItemId: fixtures.soldOut.id, quantity: 1 },
    ]})
    const after = await (await app.request('/orders')).json()
    expect(after.meta.total).toBe(before.meta.total)
  })
})
```

- [ ] **Step 2: Run and watch them all fail**

Run: `pnpm --filter @repo/backend test order-create`
Expected: FAIL — 13 failures, route missing.

- [ ] **Step 3: Write the request schema**

`src/schemas/orders.ts`:
```ts
export const createOrderSchema = z.object({
  channel: z.enum(orderChannelValues).openapi({ example: 'takeaway' }),
  customerId: z.string().uuid().nullish(),
  notes: z.string().max(500).nullish(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive().max(99),
    notes: z.string().max(200).nullish(),
  })).min(1, 'An order must contain at least one item'),
}).openapi('CreateOrder')
```

Note what is *absent*: no price, no total, no status. The client cannot express them, so it cannot influence them. This is the "never trust the client for money" rule enforced by the type rather than by a runtime check someone might forget.

- [ ] **Step 4: Implement the service**

`src/services/orders.ts` — follow spec §6's nine steps in order:
```ts
export async function createOrder(db: Db, input: CreateOrderInput, now = new Date()) {
  const settings = await getSettings(db)

  // 2. channel enabled?
  const channelEnabled = {
    dine_in: settings.dineInEnabled, takeaway: settings.takeawayEnabled, delivery: settings.deliveryEnabled,
  }[input.channel]
  if (!channelEnabled) {
    throw new AppError('CHANNEL_DISABLED', `Ordering is currently unavailable for ${input.channel}`, 422)
  }

  // 3. open?
  if (!isWithinOpeningHours(now, settings.openingHours, settings.timezone)) {
    throw new AppError('OUTSIDE_OPENING_HOURS', 'The restaurant is closed', 422)
  }

  // 4. items exist and are not archived
  const ids = input.items.map((i) => i.menuItemId)
  const rows = await db.select().from(menuItems).where(and(inArray(menuItems.id, ids), eq(menuItems.isArchived, false)))
  const byId = new Map(rows.map((r) => [r.id, r]))
  const missing = ids.filter((id) => !byId.has(id))
  if (missing.length) throw new AppError('NOT_FOUND', 'One or more menu items do not exist', 404, { missing })

  // 5. all available
  const unavailable = rows.filter((r) => !r.isAvailable)
  if (unavailable.length) {
    throw new AppError('ITEM_UNAVAILABLE', 'One or more items are unavailable', 422, {
      unavailableItems: unavailable.map((r) => ({ id: r.id, name: r.name })),
    })
  }

  // 6. money — server-side prices only
  const lines = input.items.map((i) => {
    const item = byId.get(i.menuItemId)!
    return { menuItemId: item.id, nameSnapshot: item.name, unitPriceCents: item.priceCents, quantity: i.quantity, notes: i.notes ?? null }
  })
  const subtotalCents = sumCents(lines.map((l) => l.unitPriceCents * l.quantity))
  const deliveryFeeCents = input.channel === 'delivery' ? settings.deliveryFeeCents : 0
  const taxCents = calcTaxCents(subtotalCents, settings.taxRatePercent)
  const totalCents = subtotalCents + taxCents + deliveryFeeCents

  // 7 + 8
  const status = settings.autoAcceptOrders ? 'accepted' : 'pending'
  const estimatedReadyAt = addMinutes(now, settings.defaultPrepTimeMinutes)

  // 9. atomic
  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      customerId: input.customerId ?? null, channel: input.channel, status,
      subtotalCents, taxCents, deliveryFeeCents, totalCents,
      notes: input.notes ?? null, estimatedReadyAt, placedAt: now,
    }).returning({ id: orders.id })
    await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order!.id })))
    return order!.id
  })

  return getOrderDetail(db, orderId)
}
```

Tax is computed on `subtotalCents` only, not including the delivery fee — spec §5.3 states this explicitly so the test can assert it deliberately.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @repo/backend test order-create`
Expected: PASS, 13 tests.

- [ ] **Step 6: Regenerate contract and commit**

```bash
pnpm gen:contract
git add -A && git commit -m "feat(backend): order creation with server-side pricing and settings enforcement"
```

---

## Task 12: Order Action endpoints (the state machine)

**Files:**
- Modify: `services/backend/src/services/orders.ts`, `src/routes/orders.ts`
- Test: `services/backend/test/order-transitions.test.ts`

**Interfaces:**
- Produces: `POST /orders/:id/{accept,start-preparing,mark-ready,complete,cancel}` with `operationId`s `acceptOrder`, `startPreparingOrder`, `markOrderReady`, `completeOrder`, `cancelOrder` → `useAcceptOrder()` etc.
- Consumes: `ORDER_TRANSITIONS`, `resolveTransition` (Task 5).

Implements ADR 0004 and spec §7.

- [ ] **Step 1: Write the failing tests**

```ts
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus, type OrderAction } from '@repo/types'

const ACTION_PATHS: Record<OrderAction, string> = {
  accept: 'accept', startPreparing: 'start-preparing', markReady: 'mark-ready',
  complete: 'complete', cancel: 'cancel',
}

describe('order actions', () => {
  // Data-driven from the shared map: if the map changes, the tests change with it.
  for (const status of ORDER_STATUSES) {
    for (const [action, expected] of Object.entries(ORDER_TRANSITIONS[status]) as [OrderAction, OrderStatus][]) {
      it(`allows ${action} from ${status} -> ${expected}`, async () => {
        const order = await fixtures.orderInStatus(status)
        const res = await app.request(`/orders/${order.id}/${ACTION_PATHS[action]}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action === 'cancel' ? { reason: 'Out of stock' } : {}),
        })
        expect(res.status).toBe(200)
        expect((await res.json()).status).toBe(expected)
      })
    }
  }

  it('returns 409 when completing a pending order', async () => {
    const order = await fixtures.orderInStatus('pending')
    const res = await app.request(`/orders/${order.id}/complete`, { method: 'POST' })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe('INVALID_TRANSITION')
    expect(body.error.details.currentStatus).toBe('pending')
    expect(body.error.details.allowedActions.sort()).toEqual(['accept', 'cancel'])
  })

  it('refuses every action on a cancelled order', async () => {
    const order = await fixtures.orderInStatus('cancelled')
    for (const path of Object.values(ACTION_PATHS)) {
      const res = await app.request(`/orders/${order.id}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'x' }),
      })
      expect(res.status).toBe(409)
    }
  })

  it('refuses to cancel a ready order', async () => {
    const order = await fixtures.orderInStatus('ready')
    const res = await app.request(`/orders/${order.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'changed mind' }),
    })
    expect(res.status).toBe(409)
  })

  it('requires a reason to cancel', async () => {
    const order = await fixtures.orderInStatus('pending')
    const res = await app.request(`/orders/${order.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    })
    expect(res.status).toBe(422)
  })

  it('stores the cancellation reason', async () => {
    const order = await fixtures.orderInStatus('pending')
    await app.request(`/orders/${order.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Kitchen closed early' }),
    })
    const after = await (await app.request(`/orders/${order.id}`)).json()
    expect(after.cancellationReason).toBe('Kitchen closed early')
  })

  it('404s for an unknown order', async () => {
    const res = await app.request('/orders/00000000-0000-0000-0000-000000000000/accept', { method: 'POST' })
    expect(res.status).toBe(404)
  })
})
```

The first block is the important one: it iterates the shared transition map rather than restating it. Add a status to `ORDER_TRANSITIONS` and the test suite grows automatically — the tests can't drift from the map because they *are* the map.

- [ ] **Step 2: Run and watch fail** — expect ~14 failures.

- [ ] **Step 3: Implement one generic transition function**

```ts
export async function performAction(db: Db, orderId: string, action: OrderAction, reason?: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404)

  const next = resolveTransition(order.status, action)
  if (!next) {
    throw new AppError('INVALID_TRANSITION', `Cannot ${action} an order that is ${order.status}`, 409, {
      currentStatus: order.status,
      allowedActions: getAvailableActions(order.status),
    })
  }

  await db.update(orders)
    .set({ status: next, updatedAt: new Date(), ...(action === 'cancel' ? { cancellationReason: reason! } : {}) })
    .where(eq(orders.id, orderId))

  return getOrderDetail(db, orderId)
}
```

Five routes, one function. The routes differ only in path, `operationId`, and whether they accept a `reason` body. Note the details payload returns `allowedActions` — the frontend can use it to refresh its buttons after a conflict rather than guessing.

- [ ] **Step 4: Run tests** → PASS, ~14 tests.

- [ ] **Step 5: Regenerate and commit**

```bash
pnpm gen:contract
git add -A && git commit -m "feat(backend): order action endpoints enforcing the shared transition map"
```

---

## Task 13: Order listing, filtering and detail

**Files:**
- Modify: `services/backend/src/routes/orders.ts`, `src/services/orders.ts`, `src/schemas/orders.ts`
- Test: `services/backend/test/order-list.test.ts`

**Interfaces:**
- Produces: `listOrders` (query: `status`, `channel`, `from`, `to`, `search`, `page`, `pageSize`), `getOrder` → `useListOrders`, `useGetOrder`.

- [ ] **Step 1: Write the failing tests**

```ts
it('filters by status', async () => {
  const res = await app.request('/orders?status=pending')
  const body = await res.json()
  expect(body.data.every((o: { status: string }) => o.status === 'pending')).toBe(true)
})

it('filters by date range', async () => {
  const res = await app.request('/orders?from=2026-08-01T00:00:00Z&to=2026-08-14T00:00:00Z')
  const body = await res.json()
  for (const o of body.data) {
    expect(new Date(o.placedAt).getTime()).toBeGreaterThanOrEqual(Date.parse('2026-08-01T00:00:00Z'))
  }
})

it('searches by order number', async () => {
  const all = await (await app.request('/orders')).json()
  const target = all.data[0]
  const res = await app.request(`/orders?search=${target.orderNumber}`)
  expect((await res.json()).data[0].id).toBe(target.id)
})

it('paginates with accurate total', async () => {
  const res = await app.request('/orders?page=1&pageSize=5')
  const body = await res.json()
  expect(body.data).toHaveLength(5)
  expect(body.meta.total).toBeGreaterThan(5)
})

it('returns full detail including items and customer', async () => {
  const all = await (await app.request('/orders')).json()
  const res = await app.request(`/orders/${all.data[0].id}`)
  const order = await res.json()
  expect(Array.isArray(order.items)).toBe(true)
  expect(order.items[0]).toHaveProperty('nameSnapshot')
  expect(order).toHaveProperty('customer')
})
```

- [ ] **Step 2: Run and watch fail.**

- [ ] **Step 3: Implement**

Build the `where` clause by collecting conditions into an array and passing `and(...conditions)`; run `count()` and the page query. List rows include `customerName` and `itemCount` (a subquery count) so the table needs no N+1 fetches. Detail uses Drizzle's relational query API:
```ts
const order = await db.query.orders.findFirst({
  where: eq(orders.id, id),
  with: { items: true, customer: true },
})
```

`pageSize` is capped at 100 in the schema (`z.coerce.number().int().min(1).max(100).default(25)`) — an uncapped page size is an easy way for a client to ask for the whole table.

- [ ] **Step 4: Run tests, regenerate, commit**

```bash
pnpm --filter @repo/backend test order-list && pnpm gen:contract
git add -A && git commit -m "feat(backend): order listing with filters, pagination and detail"
```

---

## Task 14: Home stats endpoint

**Files:**
- Create: `services/backend/src/services/stats.ts`, `src/routes/stats.ts`, `src/schemas/stats.ts`
- Test: `services/backend/test/stats.test.ts`

**Interfaces:**
- Produces: `GET /stats/summary` → `operationId: getStatsSummary` → `useGetStatsSummary()`, returning `{ totalOrders, revenueCents, pendingOrders, averageOrderValueCents, topItems: [{ menuItemId, name, quantitySold }], dailyTrend: [{ date, orderCount, revenueCents }] }`.

- [ ] **Step 1: Write the failing tests**

```ts
it('excludes cancelled orders from revenue', async () => {
  const summary = await (await app.request('/stats/summary')).json()
  const orders = await (await app.request('/orders?pageSize=100')).json()
  const expected = orders.data
    .filter((o: { status: string }) => o.status !== 'cancelled')
    .reduce((s: number, o: { totalCents: number }) => s + o.totalCents, 0)
  expect(summary.revenueCents).toBe(expected)
})

it('returns exactly seven days of trend data', async () => {
  const summary = await (await app.request('/stats/summary')).json()
  expect(summary.dailyTrend).toHaveLength(7)
})

it('returns at most five top items, sorted descending', async () => {
  const { topItems } = await (await app.request('/stats/summary')).json()
  expect(topItems.length).toBeLessThanOrEqual(5)
  const sold = topItems.map((i: { quantitySold: number }) => i.quantitySold)
  expect([...sold].sort((a, b) => b - a)).toEqual(sold)
})

it('reports zero average order value when there are no orders', async () => {
  const { db } = await createTestDb()          // empty, not seeded
  const emptyApp = createTestApp(db)
  await seedSettingsOnly(db)
  const summary = await (await emptyApp.request('/stats/summary')).json()
  expect(summary.averageOrderValueCents).toBe(0)
})
```

The empty case matters: `sum / count` with no orders is `NaN`, which serialises to `null` in JSON and renders as a blank KPI card. Handling it here means the frontend never has to.

- [ ] **Step 2: Run and watch fail.**

- [ ] **Step 3: Implement**

One handler, several aggregate queries run with `Promise.all`. Remember `::int` casts on every `count`/`sum` (Task 9). The 7-day trend must emit a row for days with **zero** orders — generate the seven date keys in JavaScript and left-join the grouped results onto them, rather than returning only days that happen to have data, or the chart will have gaps.

- [ ] **Step 4: Run tests, regenerate, commit**

```bash
pnpm --filter @repo/backend test stats && pnpm gen:contract
git add -A && git commit -m "feat(backend): home summary statistics endpoint"
```

**Backend is now complete. Checkpoint: run `pnpm test && pnpm typecheck && pnpm gen:contract && git diff --exit-code` — all must pass before starting the frontend.**

---

## Task 15: Design tokens and theming

**Files:**
- Create: `packages/ui/package.json`, `src/theme/tokens.ts`, `src/theme/dark.ts`, `src/theme/ThemeProvider.tsx`, `src/theme/types.ts`, `src/index.ts`
- Test: `packages/ui/test/tokens.test.ts`

**Interfaces:**
- Produces: `lightTheme`, `darkTheme`, `type Theme`, `ThemeProvider`, `useTheme(): Theme`, `useThemeMode(): { mode, setMode }`.
- Consumed by: every primitive and every screen.

- [ ] **Step 1: Define the token types first**

`src/theme/types.ts` — defining the *shape* before the values is what forces light and dark to stay in lockstep. `darkTheme` must satisfy `Theme` or it won't compile.
```ts
export type ColorTokens = {
  bg: { canvas: string; surface: string; raised: string; overlay: string; inset: string }
  text: { primary: string; secondary: string; muted: string; inverse: string; onBrand: string }
  border: { subtle: string; default: string; strong: string; focus: string }
  brand: { default: string; hover: string; active: string; subtle: string; onBrand: string }
  status: Record<'success'|'warning'|'danger'|'info'|'neutral', { bg: string; fg: string; border: string }>
}
export type Theme = {
  mode: 'light' | 'dark'
  color: ColorTokens
  space: Record<'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl', number>
  radius: Record<'none'|'sm'|'md'|'lg'|'full', number>
  typography: Record<'display'|'h1'|'h2'|'h3'|'body'|'bodyStrong'|'caption'|'mono',
    { fontSize: number; fontWeight: '400'|'500'|'600'|'700'; lineHeight: number; fontFamily?: string }>
  elevation: Record<'flat'|'raised'|'overlay'|'modal', object>
  borderWidth: Record<'thin'|'medium'|'thick', number>
}
```

- [ ] **Step 2: Write the light and dark token sets**

`space`: `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 }` — a 4px grid. Every margin and padding in the app is one of these seven numbers.

`elevation` returns platform-appropriate style objects — `shadowColor`/`shadowOpacity`/`shadowRadius`/`shadowOffset` plus `elevation` for Android — so a component says `...theme.elevation.overlay` and never writes a shadow by hand.

For dark mode, do **not** simply invert. Raise surfaces by lightening (`canvas` darkest, `raised` lightest), reduce shadow opacity (shadows read poorly on dark), and desaturate status colors slightly so they don't glare.

- [ ] **Step 3: Write the provider**

```tsx
const ThemeContext = createContext<Theme>(lightTheme)
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [override, setOverride] = useState<'light' | 'dark' | null>(null)
  const mode = override ?? (system === 'dark' ? 'dark' : 'light')
  const theme = mode === 'dark' ? darkTheme : lightTheme
  return (
    <ThemeContext.Provider value={theme}>
      <ThemeModeContext.Provider value={{ mode, setMode: setOverride }}>{children}</ThemeModeContext.Provider>
    </ThemeContext.Provider>
  )
}
export const useTheme = () => useContext(ThemeContext)
```

- [ ] **Step 4: Write the token parity test**

```ts
import { describe, it, expect } from 'vitest'
import { lightTheme, darkTheme } from '../src/theme'

function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k))
}

describe('theme tokens', () => {
  it('light and dark expose identical token paths', () => {
    expect(keyPaths(darkTheme).sort()).toEqual(keyPaths(lightTheme).sort())
  })
  it('spacing follows a 4px grid', () => {
    for (const v of Object.values(lightTheme.space)) expect(v % 4).toBe(0)
  })
})
```

This test is the guarantee that dark mode can never be half-finished — a missing dark token fails the build.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm --filter @repo/ui test
git add -A && git commit -m "feat(ui): design tokens with light and dark themes"
```

---

## Task 16: Core primitives — layout, text, surfaces, badges, buttons

**Files:**
- Create: `packages/ui/src/primitives/{Text,Heading,Stack,Inline,Grid,Surface,Card,Divider,Badge,Button,IconButton,Spinner}.tsx`
- Test: `packages/ui/test/Button.test.tsx`

**Interfaces:**
- Produces: `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" loading disabled onPress>`, `<Badge tone="success|warning|danger|info|neutral">`, `<Stack gap="md">`, `<Card elevation="raised" padding="lg">`, `<Text variant="body" color="muted">`.

- [ ] **Step 1: Establish the styling pattern once**

Every primitive follows this shape — a themed style factory plus explicit interaction states:
```tsx
export function Button({ variant = 'primary', size = 'md', loading, disabled, children, onPress }: ButtonProps) {
  const t = useTheme()
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const isDisabled = disabled || loading
  const s = buttonStyles(t, variant, size, { hovered, pressed, disabled: isDisabled })
  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={s.container}
    >
      {loading ? <Spinner size={size} tone={variant === 'primary' ? 'inverse' : 'default'} /> : <Text style={s.label}>{children}</Text>}
    </Pressable>
  )
}
```

`onHoverIn`/`onHoverOut` are React Native Web's hover support. Because every interactive primitive handles hover, focus, press and disabled here, no screen ever writes an interaction state — which is precisely what the brief is checking for.

- [ ] **Step 2: Write the Button test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Button } from '../src/primitives/Button'
import { ThemeProvider } from '../src/theme/ThemeProvider'

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

it('calls onPress when enabled', () => {
  const onPress = vi.fn()
  wrap(<Button onPress={onPress}>Accept</Button>)
  fireEvent.press(screen.getByText('Accept'))
  expect(onPress).toHaveBeenCalledOnce()
})

it('does not call onPress when disabled', () => {
  const onPress = vi.fn()
  wrap(<Button onPress={onPress} disabled>Accept</Button>)
  fireEvent.press(screen.getByText('Accept'))
  expect(onPress).not.toHaveBeenCalled()
})

it('does not call onPress while loading', () => {
  const onPress = vi.fn()
  wrap(<Button onPress={onPress} loading>Accept</Button>)
  expect(screen.queryByText('Accept')).toBeNull()
  expect(onPress).not.toHaveBeenCalled()
})
```

Testing that a loading button can't be pressed is worth it: double-submitting an order is a real bug with real consequences.

- [ ] **Step 3: Build the rest of the batch**

`Stack`/`Inline` take `gap` from the space scale, never a number. `Card` takes `elevation` and `padding` from tokens. `Badge` takes a `tone` and reads `theme.color.status[tone]` — it knows nothing about orders. `Text` takes `variant` (typography role) and `color` (semantic name).

- [ ] **Step 4: Run tests and commit**

```bash
pnpm --filter @repo/ui test
git add -A && git commit -m "feat(ui): layout, text, surface, badge and button primitives"
```

---

## Task 17: Form and overlay primitives

**Files:**
- Create: `packages/ui/src/primitives/{Input,Textarea,Select,Switch,Field,Modal,Drawer,Toast,ToastProvider,Skeleton,EmptyState,ErrorState,Table,Tabs,Pagination,Avatar,SearchInput,DateRangePicker}.tsx`
- Test: `packages/ui/test/Select.test.tsx`, `test/Table.test.tsx`

**Interfaces:**
- Produces: `<Field label error hint>`, `<Input value onChangeText error>`, `<Select options value onChange>`, `<Modal open onClose title footer>`, `<Drawer open onClose title width>`, `useToast(): { show(message, tone) }`, `<Table columns data loading empty error onRowPress>`, `<Skeleton width height>`, `<EmptyState icon title description action>`, `<ErrorState error onRetry>`.

- [ ] **Step 1: Make `Table` do the state work**

This is the highest-leverage primitive in the app. Give it `loading`, `error`, `onRetry` and `emptyState` props so that every list screen gets all four states without writing a single conditional:
```tsx
export function Table<T>({ columns, data, loading, error, onRetry, emptyState, onRowPress, keyExtractor }: TableProps<T>) {
  if (loading) return <TableSkeleton columns={columns} rows={6} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!data.length) return emptyState ?? <EmptyState title="Nothing here yet" />
  // …header row + data rows, with hover highlight on Pressable rows
}
```
`TableSkeleton` renders skeleton cells in the same column widths as the real table, so loading doesn't shift the layout when data arrives.

- [ ] **Step 2: Build Modal and Drawer on one base**

Both are an overlay plus a positioned panel; they differ in animation and placement. Share a `Portal`/backdrop component so Escape-to-close, backdrop-click-to-close, and scroll locking are implemented once.

- [ ] **Step 3: Toast**

`ToastProvider` holds a queue in context; `useToast()` returns `show(message, tone)`. Toasts auto-dismiss after 4s, stack bottom-right, and use the same status tones as `Badge`. Mutations across the app call this — it is the single feedback channel.

- [ ] **Step 4: Write the tests**

```tsx
it('renders the empty state when data is empty', () => {
  wrap(<Table columns={cols} data={[]} keyExtractor={(r) => r.id} emptyState={<EmptyState title="No orders yet" />} />)
  expect(screen.getByText('No orders yet')).toBeTruthy()
})

it('renders skeletons while loading', () => {
  wrap(<Table columns={cols} data={[]} loading keyExtractor={(r) => r.id} />)
  expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
})

it('renders an error state with a working retry', () => {
  const onRetry = vi.fn()
  wrap(<Table columns={cols} data={[]} error={new Error('boom')} onRetry={onRetry} keyExtractor={(r) => r.id} />)
  fireEvent.press(screen.getByText('Try again'))
  expect(onRetry).toHaveBeenCalledOnce()
})

it('selects an option', () => {
  const onChange = vi.fn()
  wrap(<Select options={[{ label: 'Dine in', value: 'dine_in' }]} value={null} onChange={onChange} placeholder="Channel" />)
  fireEvent.press(screen.getByText('Channel'))
  fireEvent.press(screen.getByText('Dine in'))
  expect(onChange).toHaveBeenCalledWith('dine_in')
})
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm --filter @repo/ui test
git add -A && git commit -m "feat(ui): form controls, overlays, table and feedback primitives"
```

---

## Task 18: Dashboard app shell

**Files:**
- Create: `apps/dashboard/package.json`, `app.json`, `tsconfig.json`, `metro.config.js`, `babel.config.js`
- Create: `apps/dashboard/app/_layout.tsx`, `app/(dashboard)/_layout.tsx`
- Create: `apps/dashboard/src/components/{AppShell,Sidebar,Topbar,PageHeader}.tsx`
- Create: `packages/api-client/src/query-client.tsx`

**Interfaces:**
- Produces: a running web app at `:8081` with working navigation between all six routes; `<ApiProvider>` wrapping React Query.
- Consumes: `@repo/ui` theme (Task 15), `@repo/api-client` (Task 4).

- [ ] **Step 1: Scaffold Expo with Expo Router**

`app.json` sets `"web": { "bundler": "metro", "output": "static" }`. Metro must be configured for the monorepo — watch the workspace root and resolve from both the app's and the root's `node_modules`:
```js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const workspaceRoot = path.resolve(__dirname, '../..')
const config = getDefaultConfig(__dirname)
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.disableHierarchicalLookup = true
module.exports = config
```
Skipping this is the classic Expo-in-a-monorepo failure — the app builds but can't resolve `@repo/ui`.

- [ ] **Step 2: Configure React Query**

`packages/api-client/src/query-client.tsx`:
```tsx
export function ApiProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
      mutations: { retry: 0 },
    },
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```
`retry: 0` on mutations is deliberate — silently retrying "create order" could produce two orders.

- [ ] **Step 3: Build the shell**

`app/_layout.tsx` nests `ThemeProvider` → `ApiProvider` → `ToastProvider` → `Slot`.

`app/(dashboard)/_layout.tsx` renders a persistent sidebar (nav items with active state derived from `usePathname()`, a theme toggle at the bottom) and a content area. On narrow viewports the sidebar collapses to icons — one `useWindowDimensions` breakpoint, not a responsive framework.

- [ ] **Step 4: Verify navigation end to end**

Run: `pnpm dev` (backend and dashboard together)
Expected: `localhost:8081` renders the shell; all six nav links change route; the active item is highlighted; toggling the theme repaints the shell.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(dashboard): expo router app shell with sidebar navigation"
```

---

## Task 19: UI Library route

**Files:**
- Create: `apps/dashboard/app/ui-library/index.tsx`
- Create: `apps/dashboard/src/features/ui-library/{TokenGrid,TypeSpecimen,SpacingScale,ElevationScale,ComponentSection}.tsx`

**Interfaces:**
- Consumes: the full `@repo/ui` surface. Produces nothing others depend on.

- [ ] **Step 1: Render tokens from the token objects, never by hand**

```tsx
const theme = useTheme()
// Swatches are derived — add a color token and it appears here automatically.
{Object.entries(theme.color.status).map(([name, tone]) => (
  <Swatch key={name} name={name} bg={tone.bg} fg={tone.fg} border={tone.border} />
))}
```
Hardcoding the swatch list would make this page a lie the first time a token is added. Deriving it makes the page a live view of the system.

- [ ] **Step 2: Build the sections**

Tokens (color swatches with names and values), Typography (every variant with its specimen and metrics), Spacing (bars scaled to each step), Radius & Elevation (surfaces demonstrating each level), then a section per primitive showing **every state side by side**: default, hover (annotated), focus, active, disabled, loading, error.

- [ ] **Step 3: Verify and commit**

Run: open `localhost:8081/ui-library` in both light and dark mode.
Expected: every primitive and state renders; nothing is visually broken in either theme.

```bash
git add -A && git commit -m "feat(dashboard): ui library route documenting tokens and primitives"
```

---

## Task 20: Home screen

**Files:**
- Create: `apps/dashboard/app/(dashboard)/index.tsx`
- Create: `apps/dashboard/src/features/home/{KpiCard,TrendBars,TopItemsList,RecentOrdersCard,useHomeSummary.ts}.tsx`

**Interfaces:**
- Consumes: `useGetStatsSummary` (Task 14), `useListOrders` (Task 13).

- [ ] **Step 1: Write the feature hook**

```ts
export function useHomeSummary() {
  const { data, isLoading, error, refetch } = useGetStatsSummary()
  const currency = useCurrency()
  return {
    isLoading, error, refetch,
    kpis: data ? [
      { label: 'Total orders', value: String(data.totalOrders) },
      { label: 'Revenue', value: formatMoney(data.revenueCents, currency) },
      { label: 'Pending', value: String(data.pendingOrders), tone: data.pendingOrders > 0 ? 'warning' as const : undefined },
      { label: 'Avg order value', value: formatMoney(data.averageOrderValueCents, currency) },
    ] : [],
    trend: data?.dailyTrend ?? [],
    topItems: data?.topItems ?? [],
  }
}
```
The screen receives display-ready strings. It performs no formatting and no conditionals — that's the layering rule from spec §10.1 made concrete.

- [ ] **Step 2: Build the screen**

Grid of four `KpiCard`s, a `TrendBars` row (bars sized as a percentage of the max, built from `Surface` and tokens — no charting library), `TopItemsList`, and `RecentOrdersCard` linking into Orders. Loading renders `Skeleton` in the exact card shapes.

- [ ] **Step 3: Verify all three states**

- Data: with the seed loaded, KPIs show real figures.
- Loading: throttle the network in devtools; skeletons appear in the card layout with no shift.
- Error: stop the backend and reload; `ErrorState` with a working retry.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(dashboard): home screen with kpis, trend and top items"
```

---

## Task 21: Orders screen — list, filters, detail drawer, actions

**Files:**
- Create: `apps/dashboard/app/(dashboard)/orders/index.tsx`
- Create: `apps/dashboard/src/features/orders/{OrdersTable,OrderFilterBar,OrderDetailDrawer,OrderStatusBadge,OrderActionBar,useOrderFilters.ts,useOrderActions.ts}.tsx`

**Interfaces:**
- Consumes: `useListOrders`, `useGetOrder`, the five action hooks, `ORDER_TRANSITIONS` / `getAvailableActions` (Task 5).

This is the screen the assessment will be judged on hardest. Budget accordingly.

- [ ] **Step 1: Write the actions hook — the heart of the screen**

```ts
export function useOrderActions(order: OrderDetail | undefined) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const onSuccess = (next: OrderDetail) => {
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() })
    toast.show(`Order #${next.orderNumber} is now ${ORDER_STATUS_LABELS[next.status]}`, 'success')
  }
  const onError = (e: unknown) => {
    if (e instanceof ApiError && e.code === 'INVALID_TRANSITION') {
      toast.show('This order has already moved on — refreshing', 'warning')
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order!.id) })
      return
    }
    toast.show(e instanceof ApiError ? e.message : 'Something went wrong', 'danger')
  }

  const accept = useAcceptOrder({ mutation: { onSuccess, onError } })
  const startPreparing = useStartPreparingOrder({ mutation: { onSuccess, onError } })
  const markReady = useMarkOrderReady({ mutation: { onSuccess, onError } })
  const complete = useCompleteOrder({ mutation: { onSuccess, onError } })
  const cancel = useCancelOrder({ mutation: { onSuccess, onError } })

  // Buttons come from the SAME map the server enforces (spec §7.2).
  const availableActions = order ? getAvailableActions(order.status) : []

  return { availableActions, accept, startPreparing, markReady, complete, cancel }
}
```

The `INVALID_TRANSITION` branch is worth the four lines: two staff members working the same board *will* hit it, and "refresh and tell them calmly" is the correct behaviour, not a red error.

- [ ] **Step 2: Build the filter bar**

`useOrderFilters` holds status, channel, date range, search — search debounced 300ms — and returns the query params object passed to `useListOrders`. Filters live in URL search params via Expo Router so a filtered view is shareable and survives reload. An active-filter count with a "Clear all" chip.

- [ ] **Step 3: Build the table and drawer**

Columns: order number, time, customer (or "Walk-in"), channel, item count, total, status badge. Row press opens `OrderDetailDrawer`.

Drawer contents: header with order number and status badge; customer block; the item list with `nameSnapshot` and per-line totals; the **receipt breakdown** — subtotal, tax, delivery fee, total — laid out as a real receipt; notes; cancellation reason if present; and `OrderActionBar` at the bottom rendering one button per available action. Cancel opens a confirmation modal requiring a reason (the API demands it, so the UI must collect it).

Invalid actions are **absent, not disabled** (spec §7.2).

- [ ] **Step 4: Verify the state machine visually**

Open a pending order → only "Accept" and "Cancel" appear → Accept → the buttons change to "Start preparing"/"Cancel" → advance to `ready` → **"Cancel" is gone**, only "Complete" remains → Complete → no buttons at all. The list and Home KPIs both update.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(dashboard): orders list with filters, detail drawer and status actions"
```

---

## Task 22: New Order modal

**Files:**
- Create: `apps/dashboard/src/features/orders/{NewOrderModal,ItemPicker,OrderLineList,useNewOrderForm.ts}.tsx`
- Test: `apps/dashboard/test/useNewOrderForm.test.ts`

**Interfaces:**
- Consumes: `useListMenuItems`, `useListCustomers`, `useCreateOrder`, `useGetSettings`.

- [ ] **Step 1: Write the failing test for the estimate logic**

```ts
it('estimates the total the same way the server does', () => {
  const { result } = renderHook(() => useNewOrderForm({
    settings: { taxRatePercent: 9, deliveryFeeCents: 400 },
  }))
  act(() => {
    result.current.setChannel('delivery')
    result.current.addItem({ id: 'a', name: 'Nasi Lemak', priceCents: 850 }, 2)
    result.current.addItem({ id: 'b', name: 'Teh Tarik', priceCents: 320 }, 1)
  })
  expect(result.current.estimate).toEqual({
    subtotalCents: 2020, taxCents: 182, deliveryFeeCents: 400, totalCents: 2602,
  })
})

it('drops the delivery fee when the channel changes', () => { /* … set channel to 'dine_in', expect deliveryFeeCents 0 */ })
it('removes a line when quantity reaches zero', () => { /* … */ })
```

The estimate uses `calcTaxCents` from `@repo/shared` — the *same function the backend uses*. That's why the client estimate and the server figure agree, and it's why the shared package exists.

- [ ] **Step 2: Run and watch fail.**

- [ ] **Step 3: Build the modal**

Left pane: `ItemPicker` — menu items grouped by category, searchable, unavailable items visibly disabled and unselectable (the server would reject them; don't let the user get that far). Right pane: `OrderLineList` with quantity steppers, per-line notes, and the live estimate. Header: channel `Select` (options filtered by what Settings has enabled) and optional customer `Select` with a "Walk-in" default.

On submit: `useCreateOrder`, then invalidate orders and stats, close, toast with the **server's** order number and total. Submit is disabled while the mutation is pending — no double orders.

- [ ] **Step 4: Handle the server's rejections properly**

If the API returns `ITEM_UNAVAILABLE`, use `error.details.unavailableItems` to highlight those exact lines in the modal rather than showing a generic toast. If it returns `CHANNEL_DISABLED` or `OUTSIDE_OPENING_HOURS`, show the message inline near the channel selector. This is the payoff for putting `code` and `details` in the error envelope back in Task 2.

- [ ] **Step 5: Run tests, verify manually, commit**

```bash
pnpm --filter @repo/dashboard test
git add -A && git commit -m "feat(dashboard): new order modal with live estimate and server validation handling"
```

---

## Task 23: Menu screen

**Files:**
- Create: `apps/dashboard/app/(dashboard)/menu/index.tsx`
- Create: `apps/dashboard/src/features/menu/{CategoryTabs,MenuItemTable,MenuItemFormModal,useMenuItems.ts,useToggleAvailability.ts}.tsx`

- [ ] **Step 1: Build the optimistic availability toggle**

```ts
export function useToggleAvailability() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useUpdateMenuItem({
    mutation: {
      onMutate: async ({ id, data }) => {
        const key = getListMenuItemsQueryKey()
        await queryClient.cancelQueries({ queryKey: key })
        const previous = queryClient.getQueryData(key)
        queryClient.setQueryData(key, (old: MenuItemList | undefined) =>
          old ? { ...old, data: old.data.map((i) => (i.id === id ? { ...i, isAvailable: data.isAvailable! } : i)) } : old)
        return { previous, key }
      },
      onError: (_e, _vars, ctx) => {
        if (ctx) queryClient.setQueryData(ctx.key, ctx.previous)   // roll back
        toast.show('Could not update availability', 'danger')
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() }),
    },
  })
}
```
A switch that waits 300ms before moving feels broken. Optimistic update plus rollback is the correct pattern, and rollback is the half people skip.

- [ ] **Step 2: Build the screen**

`CategoryTabs` across the top (with an "All" tab), `MenuItemTable` with name, category, price, availability switch, and row actions (Edit, Archive). "Add item" and Edit share one `MenuItemFormModal` — same component, different initial values, because a create form and an edit form that diverge is how they drift.

Archive opens a confirmation modal explaining that the item is hidden but kept for order history (ADR 0001, surfaced to the user).

- [ ] **Step 3: Verify and commit**

Toggle availability → switch moves instantly → refresh confirms it persisted. Try creating an order with that item → rejected by the server with the item named.

```bash
git add -A && git commit -m "feat(dashboard): menu management with optimistic availability toggle"
```

---

## Task 24: CRM screen

**Files:**
- Create: `apps/dashboard/app/(dashboard)/crm/index.tsx`
- Create: `apps/dashboard/src/features/crm/{CustomerTable,CustomerDetailDrawer,CustomerFormModal,useCustomers.ts}.tsx`

- [ ] **Step 1: Build the list**

`CustomerTable`: name, phone, order count, lifetime spend (formatted), last order date. Sorted by spend descending — the useful default for a CRM. Debounced search. Empty state: "No customers yet" with an "Add customer" action.

- [ ] **Step 2: Build the detail drawer**

Customer details, three summary stats (total orders, lifetime spend, average order value), and recent orders as a compact list. Each row navigates to Orders filtered to that customer — reusing `useOrderFilters`' URL params rather than building a second order list.

- [ ] **Step 3: Verify and commit**

Confirm the deliberate discrepancy from spec §4.4: Home's revenue exceeds the sum of all lifetime spend, because walk-ins belong to nobody. Make sure this is in the README so it reads as a decision, not a bug.

```bash
git add -A && git commit -m "feat(dashboard): crm with customer spend and order history"
```

---

## Task 25: Settings screen

**Files:**
- Create: `apps/dashboard/app/(dashboard)/settings/index.tsx`
- Create: `apps/dashboard/src/features/settings/{SettingsForm,OpeningHoursEditor,ChannelToggles,useSettingsForm.ts}.tsx`

- [ ] **Step 1: Build the form with dirty tracking**

`useSettingsForm` loads via `useGetSettings`, holds local state, computes `isDirty` by comparing against the loaded values, and exposes `save()` and `discard()`. A sticky footer bar appears only when dirty, showing "Discard" and "Save changes".

- [ ] **Step 2: Build the sections**

- **Ordering** — default prep time (number input, minutes), auto-accept (switch with a one-line explanation of what it does).
- **Channels** — three switches; delivery fee input, disabled unless delivery is on.
- **Opening hours** — seven rows, each with a "Closed" switch and open/close time inputs. Client-side validation mirrors the server's: `HH:mm` format, open before close.
- **Financial** — tax rate, currency, timezone.

Each switch gets a caption explaining its effect ("New orders will skip Pending and go straight to Accepted"), because a settings page that doesn't say what a toggle does is a guessing game.

- [ ] **Step 3: Verify the settings actually bite**

This is the demo moment. Turn off delivery → save → open New Order → the delivery channel is gone from the selector, and forcing it via the API returns `CHANNEL_DISABLED`. Turn on auto-accept → create an order → it lands in `Accepted`, not `Pending`. Set prep time to 45 → the new order's estimated ready time is 45 minutes out.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(dashboard): settings screen driving order rules"
```

---

## Task 26: Frontend test pass

**Files:**
- Create: `apps/dashboard/test/{order-actions.test.tsx,money-display.test.tsx}`
- Modify: `apps/dashboard/vitest.config.ts`

- [ ] **Step 1: Test the shared-map integration**

```tsx
it('renders only the actions the transition map allows', () => {
  render(<OrderActionBar order={{ ...baseOrder, status: 'ready' }} />)
  expect(screen.getByText('Complete')).toBeTruthy()
  expect(screen.queryByText('Cancel')).toBeNull()      // ready orders cannot be cancelled
  expect(screen.queryByText('Accept')).toBeNull()
})

it('renders no actions for a terminal order', () => {
  render(<OrderActionBar order={{ ...baseOrder, status: 'completed' }} />)
  expect(screen.queryByRole('button')).toBeNull()
})
```

- [ ] **Step 2: Test the four states of a list**

Mock the fetcher (not the hook) so the generated hook's real behaviour is exercised, and assert skeleton → empty → error → data.

- [ ] **Step 3: Run the full suite and commit**

Run: `pnpm test`
Expected: all packages pass.

```bash
git add -A && git commit -m "test(dashboard): order action visibility and list state coverage"
```

---

## Task 27: Dark mode pass

**Files:**
- Modify: any component found using a non-token color; `packages/ui/src/theme/dark.ts`

- [ ] **Step 1: Audit for hardcoded values**

Run: `grep -rnE "#[0-9a-fA-F]{3,8}|rgba?\(" apps/dashboard/src apps/dashboard/app packages/ui/src/primitives`
Expected: **zero matches outside `packages/ui/src/theme/`**. Every hit is a bug — fix it by adding or using a token.

- [ ] **Step 2: Walk every screen in dark mode**

All six routes plus every modal and drawer. Watch specifically for: shadows invisible on dark surfaces (reduce opacity, add a subtle border instead), status badge contrast, disabled states becoming unreadable, and skeleton shimmer being too bright.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(ui): dark mode polish across all screens"
```

---

## Task 28: CI and the contract-drift check

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - name: Contract is in sync with the schema
        run: pnpm gen:contract && git diff --exit-code
```

That last step is the one worth pointing at in the README. It fails the build if the committed OpenAPI document or generated client no longer matches the Drizzle schema — which converts "the contract is generated, not duplicated" from a claim into something the repo proves on every push. Note that no database is needed: PGlite runs in-process and `gen:contract` never opens a connection.

- [ ] **Step 2: Verify it passes, then commit**

```bash
git add -A && git commit -m "ci: lint, typecheck, test and contract drift check"
```

---

## Task 29: README and documentation

**Files:**
- Create: `README.md`
- Modify: `docs/adr/` if any decision changed during implementation

- [ ] **Step 1: Write the README**

Sections, in this order:

1. **What this is** — two sentences plus a screenshot of Home in dark mode.
2. **Run it locally** — the exact copy-pasteable sequence:
   ```bash
   pnpm install
   pnpm db:up          # docker Postgres
   cp services/backend/.env.example services/backend/.dev.vars
   pnpm db:migrate
   pnpm db:seed
   pnpm dev            # backend :8787, dashboard :8081
   ```
3. **Architecture** — the chain diagram from spec §2.2, the one-paragraph explanation, and the sentence that proves it: *"Rename a column in `schema.ts`, run `pnpm gen:contract`, and the dashboard stops typechecking. CI enforces this on every push."*
4. **Where the interesting code is** — direct links to `schema.ts`, `services/orders.ts` (the validation pipeline), `packages/types/src/order-status.ts` (the shared map), `packages/ui/src/theme/tokens.ts`. A reviewer has limited time; point them at the four files that carry the argument.
5. **Decisions** — link `CONTEXT.md` and each ADR with a one-line summary.
6. **Trade-offs and what's incomplete** — spec §14, stated plainly: no auth and why; no modifiers, plus the two-sentence sketch of how they'd be modelled; revenue vs lifetime spend not reconciling and why that's correct; native untested.
7. **Testing** — what's covered and the reasoning for targeted-over-exhaustive.
8. **Scripts** — the table from spec §12.

- [ ] **Step 2: Verify the instructions on a clean clone**

```bash
git clone <repo> /tmp/verify && cd /tmp/verify
```
Then follow the README literally, changing nothing. Any step that fails is a README bug — fix it there, not in your shell. This is the single highest-value 20 minutes in the whole project: a reviewer who can't run it reviews nothing.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: readme with setup, architecture and trade-offs"
```

---

## Task 30 (stretch): Deploy

**Files:**
- Modify: `services/backend/wrangler.toml`, `.github/workflows/ci.yml`

Only start this if Tasks 1–29 are done and polished. A broken deploy link is worse than no deploy link.

- [ ] **Step 1: Provision Neon and deploy the Worker**

Create a Neon project, run migrations against it, seed it. `wrangler secret put DATABASE_URL`, then `wrangler deploy`.

- [ ] **Step 2: Build and host the dashboard**

`pnpm --filter @repo/dashboard exec expo export --platform web` produces a static `dist/`. Deploy to Cloudflare Pages with `EXPO_PUBLIC_API_URL` pointing at the Worker. Update the Worker's CORS origin to the Pages domain.

- [ ] **Step 3: Verify and document**

Load the deployed dashboard, create an order, advance it through every status. Add both URLs to the top of the README.

```bash
git add -A && git commit -m "chore: deploy backend to cloudflare workers and dashboard to pages"
```

---

## Fallback plan — if you run out of time

Cut in this order. The point of the ordering is that everything above the cut still tells a coherent story.

1. Task 30 (deploy) — the repo is the deliverable.
2. Task 27 (dark mode) — but only if the tokens are genuinely centralised; say so in the README.
3. Task 24 (CRM) — reduce to the list only, drop the detail drawer.
4. Task 22's polish — a plainer New Order modal still demonstrates the flow.

**Never cut:** Task 4 (the contract chain), Tasks 11–12 (order pipeline and state machine), Task 19 (UI Library route — an explicit requirement), Task 29 (README). Those four carry the assessment.

---

## Self-review notes

- **Spec coverage:** §2 → T4; §3 → T1; §4 → T3; §5 → T6, T11; §6 → T11; §7 → T5, T12, T21; §8 → T8–T14; §9 → T15–T17, T19; §10 → T18, T20–T25; §11 → T5, T6, T7, T11–T14, T16, T17, T22, T26; §12 → T1, T2, T28; §13 → T7; §14 → T29.
- **Naming consistency check:** `createDb`/`Db` (T3) used in T4, T7, T9, T11, T12. `AppError`/`ErrorCode` (T2) used in T11, T12. `calcTaxCents`/`sumCents` (T6) used in T7, T11, T22. `getAvailableActions`/`resolveTransition` (T5) used in T12, T21, T26. `createTestDb`/`createTestApp` (T7) used in T8–T14. `customFetch`/`ApiError` (T4) used in T21, T22.
- **Known thin spots, deliberately:** Tasks 20–25 give the feature hooks' full code but describe the JSX layout rather than writing every line — the layout is design work best done against a running app, and the primitives from Tasks 16–17 constrain it enough that the result stays consistent. Task 7's seed is described rather than fully written for the same reason: it's 200 lines of literal dish names, not logic.
