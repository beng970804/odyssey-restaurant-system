# Restaurant Operations Dashboard — Design Spec

**Date:** 2026-08-13
**Timebox:** 2 days
**Context:** Fullstack assessment for Odyssey. Greenfield repo, public on a personal GitHub account.

---

## How to read this document

Every rule in here is written the same way: **what the rule is**, **why it exists**, and **what breaks without it** — usually with a worked example using real numbers. If a section only tells you the shape of the code and not the reason for it, that's a bug in this document.

Terms in `Title Case` are defined in [`CONTEXT.md`](../../../CONTEXT.md). That file is the vocabulary; this file is the design.

---

## 1. What we're building

A staff-facing dashboard for a single restaurant, backed by a real ordering API. Six screens: Home, Orders, Menu, CRM, Settings, and a UI Library route that documents the design system itself.

The assessment is explicit that it is grading *how* this is built more than *whether it works*. Two things carry most of that weight:

1. **The contract chain** — the data shape is written once, in the database schema, and everything downstream is generated from it.
2. **The design system** — tokens and primitives that visibly compose, rather than styles scattered across screens.

Everything in this spec serves one of those two, or serves the product flows that demonstrate them.

---

## 2. The architecture, in plain terms

### 2.1 The problem this solves

In a normal project, the shape of an `Order` gets written down four separate times: once in the database, once in the backend's validation, once in the API documentation, and once in the frontend's TypeScript types. All four must agree. Nothing enforces that they do. So they drift — a field gets renamed in the database, the frontend keeps reading the old name, and nothing complains until a user sees `undefined` on screen.

### 2.2 The fix

Write it down **once**, and generate the other three.

```
┌─────────────────────────────────────────────────────────────────┐
│  services/backend/src/db/schema.ts                              │
│  pgTable('orders', { … })          ← THE ONLY SOURCE OF TRUTH   │
└────────────────────────────┬────────────────────────────────────┘
                             │  drizzle-zod reads the table definition
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Zod schemas — createSelectSchema(orders), createInsertSchema()  │
│  Runtime validation + inferred TypeScript types, both derived    │
└────────────────────────────┬────────────────────────────────────┘
                             │  attached to each route
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  @hono/zod-openapi route definitions                             │
│  Does two jobs from one definition:                              │
│    • rejects invalid requests at runtime (422)                    │
│    • emits openapi.json describing the whole API                  │
└────────────────────────────┬────────────────────────────────────┘
                             │  pnpm gen:contract
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  packages/api-client/src/generated/**  (Orval output, never      │
│  hand-edited)                                                    │
│  Typed React Query hooks: useListOrders(), useAcceptOrder(), …   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
                      apps/dashboard screens
```

**The test of whether this is real:** rename a column in `schema.ts`, run `pnpm gen:contract`, and the dashboard should fail to typecheck at the exact places that used it. If it doesn't, the chain is decorative. This is worth verifying deliberately once, early.

### 2.3 What each tool actually does

| Tool | Its one job |
|---|---|
| **pnpm workspace** | Lets packages import each other by name (`@repo/ui`) without publishing to npm. |
| **Turborepo** | Runs tasks in dependency order and in parallel. `turbo run build` knows `api-client` must build before `dashboard`. |
| **Hono** | The web framework. Routes and middleware, built on web-standard `Request`/`Response` so it runs on Cloudflare Workers. |
| **Cloudflare Workers** | The serverless runtime. Not Node — no filesystem, and no Node TCP APIs without compatibility flags, which is why the database driver is a real decision (see ADR 0003: Neon WebSocket driver in production, postgres-js over `nodejs_compat` sockets locally). |
| **wrangler** | Cloudflare's CLI. `wrangler dev` runs the Worker locally in the same engine production uses. |
| **Drizzle ORM** | Tables defined in TypeScript. That definition generates SQL migrations and gives a fully typed query builder. |
| **Zod** | Runtime validation. TypeScript types vanish when the code runs; Zod is what actually rejects a malformed request body. |
| **drizzle-zod** | Turns a Drizzle table into Zod schemas automatically. The link that stops the truth being written twice. |
| **OpenAPI** | A JSON description of the API — every path, method, request and response shape. The standard interchange format. |
| **Orval** | Reads that JSON and generates the frontend's types and React Query hooks. |
| **React Query** | Caches server data on the client. Owns loading/error state, refetching, and cache invalidation after a mutation. |
| **Expo + React Native Web** | React Native components compiled to run in a browser. No HTML tags, no CSS files — which is why the design system is built from typed style objects. |

---

## 3. Repo layout

```
apps/
  dashboard/            Expo app (web-first, native-capable)
services/
  backend/              Hono on Cloudflare Workers
packages/
  ui/                   Design system: tokens + primitives
  types/                Hand-authored shared domain logic (see below)
  api-client/           Orval output + the React Query provider setup
  shared/               Pure utilities (money formatting, dates)
  config/               Shared tsconfig / eslint bases
docs/
  adr/                  Architecture decision records
  superpowers/          This spec and the implementation plan
CONTEXT.md              Domain glossary
```

**Why `packages/types` exists when types are generated.** It holds the small amount of domain logic that *cannot* be generated because it isn't a data shape — chiefly the Order status enum and the transition map. Both the backend (to enforce transitions) and the frontend (to decide which Action buttons to show) import the identical object. This is the direct answer to the brief's "no duplicated enums/status types across frontend and backend". If this package were empty ceremony, it would be a negative signal; it isn't, because deleting it would force that duplication.

**What must never happen:** a hand-written interface in the frontend describing a backend response. If a shape is persisted, it comes from the generated client.

---

## 4. The data model

Six tables. Every column exists for a stated reason.

### 4.1 `categories`

`id`, `name`, `sortOrder`, `createdAt`

Groups menu items. `sortOrder` exists because a menu has an intentional order — starters before desserts — and alphabetical is wrong.

### 4.2 `menu_items`

`id`, `categoryId`, `name`, `description`, `priceCents`, `isAvailable`, `isArchived`, `imageUrl`, `createdAt`, `updatedAt`

- **`priceCents` (integer, not decimal).** All money in this system is a whole number of cents. Explained in §5.1.
- **`isAvailable`.** Whether it can go on a *new* Order. It does not touch existing Orders — an Order placed an hour ago is a historical record, not a live query.
- **`isArchived`.** Menu Items are never hard-deleted. An Order Item keeps a `menuItemId` for reporting ("most popular items"), and deleting the row would break that link. "Delete" in the UI sets `isArchived` and hides it from the menu.

### 4.3 `customers`

`id`, `name`, `phone`, `email`, `notes`, `createdAt`

Deliberately thin. There is no auth in this system, so a Customer is a record the restaurant keeps, not an account anyone signs into. `phone` is the field a restaurant actually identifies people by.

### 4.4 `orders`

`id`, `orderNumber`, `customerId` (nullable), `channel`, `status`, `subtotalCents`, `taxCents`, `deliveryFeeCents`, `totalCents`, `notes`, `cancellationReason` (nullable), `estimatedReadyAt`, `placedAt`, `updatedAt`

- **`orderNumber`.** A short human-readable sequence (`#1042`). Staff read out order numbers; they do not read out UUIDs. Generated server-side.
- **`customerId` is nullable.** Walk-in Orders exist. Consequence, accepted deliberately: **Home's revenue will exceed the sum of all Customers' Lifetime Spend**, because walk-in money belongs to nobody. That is correct, and it is called out in the README so it doesn't read as a bug.
- **The four money columns are stored, not computed on read.** Explained in §5.2.
- **`cancellationReason`.** This is what distinguishes "the restaurant refused it" from "the customer changed their mind" without adding a seventh status and doubling the transition matrix.

### 4.5 `order_items`

`id`, `orderId`, `menuItemId`, `nameSnapshot`, `unitPriceCents`, `quantity`, `notes`

`nameSnapshot` and `unitPriceCents` are **frozen copies** taken when the Order is placed. See [ADR 0001](../../adr/0001-order-items-freeze-name-and-price.md). The short version: an Order is a record of something that already happened, so raising a dish's price tomorrow must not retroactively change what last week's customer paid.

### 4.6 `settings`

A single row, enforced by a `CHECK (id = 1)` constraint so a second one cannot be inserted.

`defaultPrepTimeMinutes`, `autoAcceptOrders`, `dineInEnabled`, `takeawayEnabled`, `deliveryEnabled`, `deliveryFeeCents`, `taxRatePercent`, `currency`, `timezone`, `openingHours` (JSON), `updatedAt`

**Every one of these is read by the create-order endpoint.** That is the point. A settings page whose values are stored and never consulted is a dead form — it looks like a feature and is actually a text box. Here, flipping `deliveryEnabled` off makes the API refuse delivery Orders, which is demonstrable in thirty seconds during a walkthrough.

`openingHours` is a JSON object keyed by weekday: `{ mon: { open: "11:00", close: "22:00" }, tue: { closed: true }, … }`. Times are interpreted in the settings `timezone` (`Asia/Singapore`), not the server's — Workers run in UTC, so reading the server clock as local time would be wrong.

---

## 5. Money

### 5.1 Why integer cents

Three candidate representations:

- **Floating point** — `0.1 + 0.2 === 0.30000000000000004`. Money and floats do not mix. Disqualified.
- **Postgres `numeric`** — exact, but Drizzle surfaces it to JavaScript as a **string**, which flows through drizzle-zod into the OpenAPI document as `type: string`, which means the generated frontend types are strings, which means every piece of arithmetic in the UI becomes a parse. It pollutes exactly the layer being graded.
- **Integer cents** — `priceCents: 850` means $8.50. Exact, arithmetic-safe, and generates as a clean `number`. Formatting happens once, at the very edge, in `formatMoney()` from `packages/shared`.

**Chosen: integer cents.** The rule: no value named `price`, `total`, or `amount` exists anywhere in this system without the `Cents` suffix. The naming convention is the safeguard — a variable called `totalCents` cannot be quietly mistaken for dollars.

### 5.2 Why money is stored on the Order rather than recalculated

Suppose the Order's total were computed on every read, from current settings. Change the tax rate from 9% to 10% next month, and every receipt ever issued silently changes. Historical figures must be immutable, so the Order stores what was actually charged, at the moment it was charged.

### 5.3 The calculation, worked through

The client sends **only** `menuItemId` and `quantity` per line. It sends no prices. Any price-shaped field in the request body is ignored — not rejected, ignored, because it is simply not part of the input schema. This is the "never trust the client for money" rule, enforced by the schema rather than by a check someone has to remember to write.

A delivery order, tax at 9%, delivery fee $4.00:

```
2 × Nasi Lemak     @ 850 =  1700
1 × Teh Tarik      @ 320 =   320
                 subtotal =  2020

tax   = round(2020 × 0.09) = round(181.8) = 182
delivery fee                            =  400   (only because channel = delivery)

total = 2020 + 182 + 400 = 2602      →  displayed as "S$26.02"
```

Rounding rule: `Math.round`, applied **once**, to the tax figure only. Rounding each line item individually would produce a total that doesn't match the sum of its parts, which customers notice.

Tax is computed on the subtotal, not on the subtotal plus delivery fee. This is a modelling choice, stated here so the test can assert it deliberately rather than encoding whatever the implementation happened to do.

---

## 6. Placing an Order — the validation pipeline

This endpoint is where the backend proves it's doing real work. It runs these steps in order, and stops at the first failure.

| # | Check | Fails with | Why it exists |
|---|---|---|---|
| 1 | Body matches the Zod schema — non-empty items, positive integer quantities, valid channel | `422` | Structural validity. Free, because the schema is the route definition. |
| 2 | Channel is enabled in Settings | `422` | Makes the Settings toggles real. Refusing delivery when delivery is off is a business rule, not a form validation. |
| 3 | Current time is inside Opening Hours (in the settings timezone) | `422` | Same reason. A closed restaurant cannot take orders. |
| 4 | Every `menuItemId` exists and is not archived | `404` | Catches stale clients referencing deleted items. |
| 5 | Every Menu Item has `isAvailable = true` | `422`, naming the offending items | Literally required by the brief: "reject unavailable menu items". The response names *which* items failed so the UI can highlight them rather than showing a generic error. |
| 6 | Compute subtotal, tax, delivery fee, total from **server-side** prices | — | §5.3. |
| 7 | Set status: `accepted` if Settings has auto-accept, else `pending` | — | Makes the auto-accept toggle visibly change the Orders board. |
| 8 | Compute `estimatedReadyAt` = now + `defaultPrepTimeMinutes` | — | Makes the prep-time setting do something. |
| 9 | Insert order + order items **in one transaction** | — | An Order with no items, or items with no Order, is corrupt data. It's one atomic fact, so it's one transaction. |

Steps 2, 3, 5, 7 and 8 all read Settings. That's five distinct behaviours driven by one page, which is why Settings isn't filler.

---

## 7. Order status — the state machine

### 7.1 The principle

**Staff perform Actions. They never set a Status.** "Accept this order" is something a person does; `status = 'accepted'` is a consequence the server derives. The brief says this outright: *"Do not make status updates a loose client-controlled field change."*

So the API exposes named operations, not a status field:

```
POST /orders/:id/accept
POST /orders/:id/start-preparing
POST /orders/:id/mark-ready
POST /orders/:id/complete
POST /orders/:id/cancel          { reason: string }
```

There is **no** `PATCH /orders/:id { status }`. It doesn't exist, so it cannot be misused.

Three things fall out of this for free:
- The OpenAPI document reads as a list of business operations, which is self-documenting.
- Orval generates `useAcceptOrder()` rather than `usePatchOrder({ status: 'accepted' })`.
- Each Action gets its own place to hang side effects — `cancel` requires a reason, `complete` could later trigger a receipt — without a growing `switch` statement.

### 7.2 The transition map

Lives in `packages/types/src/order-status.ts` and is imported by **both** sides:

```ts
export const ORDER_TRANSITIONS = {
  pending:   { accept: 'accepted', cancel: 'cancelled' },
  accepted:  { startPreparing: 'preparing', cancel: 'cancelled' },
  preparing: { markReady: 'ready', cancel: 'cancelled' },
  ready:     { complete: 'completed' },
  completed: {},
  cancelled: {},
} as const
```

- **Backend:** an Action on an Order whose current status doesn't list it returns **`409 Conflict`** with a message naming the current status and the legal Actions. `409` rather than `400` because the request is well-formed — it's the *state* that makes it impossible.
- **Frontend:** the same object decides which buttons render. Invalid Actions are **absent**, not disabled — a disabled button invites the user to wonder what they did wrong.

Because both read one object, the UI cannot offer an Action the server will refuse. That's the property worth demonstrating, and it is the single sharpest thing to unit-test.

**Two deliberate asymmetries:**
- A `ready` Order cannot be cancelled — the food is made and the cost is sunk.
- `completed` and `cancelled` have no exits. Terminal means terminal. Reversing an Order is a refund, which is a different domain and out of scope.

---

## 8. API surface

```
GET    /doc                          OpenAPI JSON (the generation source)
GET    /reference                     Scalar API reference UI

GET    /categories
POST   /categories
PATCH  /categories/:id

GET    /menu-items                    ?categoryId= &available= &search=
POST   /menu-items
PATCH  /menu-items/:id
POST   /menu-items/:id/archive

GET    /customers                     ?search=   → includes orderCount + lifetimeSpendCents
GET    /customers/:id                 → includes recent orders
POST   /customers
PATCH  /customers/:id

GET    /orders                        ?status= &channel= &from= &to= &search= &page=
GET    /orders/:id                    → full detail with items
POST   /orders
POST   /orders/:id/accept | start-preparing | mark-ready | complete | cancel

GET    /settings
PATCH  /settings

GET    /stats/summary                 → Home KPIs
```

Conventions applied uniformly, because consistency is itself a graded signal:

- **Errors** share one envelope: `{ error: { code, message, details? } }`. `code` is a machine-readable string (`ITEM_UNAVAILABLE`, `INVALID_TRANSITION`) so the UI can react specifically; `message` is human-readable. Registered as a shared OpenAPI response so every endpoint documents it.
- **Lists** are `{ data: T[], meta: { total, page, pageSize } }`. Never a bare array — a bare array has nowhere to put pagination when you inevitably need it.
- **Timestamps** are ISO 8601 UTC strings.
- **`GET /stats/summary`** is one endpoint, not four, so Home loads in a single request: total orders, revenue, pending count, average order value, top 5 items, and a 7-day trend.

---

## 9. Design system

Lives in `packages/ui`. The requirement is not "some components" — it is a system that visibly composes.

### 9.1 Tokens

One file, `packages/ui/src/theme/tokens.ts`, typed with `as const` so autocomplete works and typos fail to compile.

- **Color** — a small primitive ramp (neutral, brand, plus green/amber/red/blue), then **semantic** aliases on top: `bg.canvas`, `bg.surface`, `bg.raised`, `text.primary`, `text.muted`, `border.subtle`, `status.success.bg` / `.fg` / `.border`. Components only ever reference semantic names. This indirection is what makes dark mode a token swap instead of a rewrite.
- **Spacing** — a 4px scale: `xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32, 3xl 48`. Every gap and padding in the app comes from here. No literal pixel values in screens.
- **Typography** — `display, h1, h2, h3, body, bodyStrong, caption, mono`, each bundling size + weight + line height together, so text is chosen by role rather than assembled ad hoc.
- **Radius / border / shadow / elevation** — an `elevation` scale (`flat, raised, overlay, modal`) that maps to shadow on web and elevation on Android, so surfaces are chosen by intent. `borderWidth` is a three-step scale (`thin, medium, thick`).
- **Layout / grid** — `breakpoints` (`sm 640, md 900, lg 1280, xl 1600`), `container` max widths, a 12-column `grid` with a token-derived gutter, and the fixed sidebar/content dimensions. These live in the token file like everything else, so "how wide is the sidebar" has one answer rather than one per screen. A `useBreakpoint()` hook reads them; screens never compare raw numbers against `useWindowDimensions`.

### 9.2 Theming

A `ThemeProvider` puts the resolved token set in context; `useTheme()` reads it. Light and dark are two objects satisfying the same type — which means **if dark mode works, the tokens are genuinely centralised**. That's why it's the top stretch item: it is a proof, not a feature.

### 9.3 Primitives

`Button` (variants × sizes × loading/disabled), `IconButton`, `Input`, `Select`, `Textarea`, `Switch`, `Field`, `Modal`, `Drawer`, `Card`/`Surface`, `Table`, `Badge`/`StatusBadge`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, `Avatar`, `Stack`/`Inline`/`Grid`, `Text`, `Heading`.

**Navigation primitives** live here too, not in the app: `NavItem` (icon + label + active/hover/focus states), `NavGroup`, `SideNav`, `Tabs`, `Breadcrumbs`. The app's `Sidebar` is then just a list of routes fed into `SideNav` — the *styling* of navigation is design-system work, and the brief lists navigation elements among the required primitives, so they must appear in the UI Library route alongside everything else.

Three rules keep this from decaying:
- **Primitives take no business types.** `StatusBadge` takes a tone and a label, not an `Order`. It is reused by Menu availability and CRM without knowing what an Order is.
- **Every interactive primitive implements hover, focus, active and disabled** at the primitive level, so no screen ever hand-rolls a hover state.
- **Focus is keyboard focus, and it is visible.** On web this means a real focus ring drawn from `color.border.focus`, appearing on keyboard navigation but not on mouse press (`:focus-visible` semantics). This is easy to skip under React Native Web because RN has no focus concept on most components, and skipping it makes the dashboard unusable by keyboard — so it is implemented once in a shared `useInteractionState()` hook that every primitive consumes.

### 9.4 The UI Library route

`/ui-library` — a required deliverable, and cheap once tokens exist because it renders the token objects directly (swatches mapped from `colors`, not hardcoded). It presents tokens, typography, spacing, surfaces/elevation, every primitive, and every state of each. It doubles as the visual regression check while building: if a token changes, this page shows it instantly.

---

## 10. Frontend structure

Expo Router, file-based. `apps/dashboard/app/`:

```
_layout.tsx           providers: Theme, React Query, Toast
(dashboard)/
  _layout.tsx         persistent sidebar + topbar shell
  index.tsx           Home
  orders/index.tsx    Orders
  menu/index.tsx      Menu
  crm/index.tsx       CRM
  settings/index.tsx  Settings
ui-library/index.tsx
```

### 10.1 The layering rule

The brief is explicit that logic must not live in page components. The layering:

```
Screen component        layout and composition only
  └── Feature component  one concern (OrdersTable, OrderDetailDrawer)
       └── Feature hook  business logic (useOrderActions, useOrderFilters)
            └── Generated hook   useListOrders() — from Orval, never hand-written
                 └── Generated fetcher → the API
```

The concrete rule: **a screen file never imports a generated hook directly and never contains a conditional based on Order status.** It composes feature components. If a screen file passes ~150 lines, something in it belongs one layer down.

### 10.2 Screens

**Home** — KPI cards (total orders, revenue, pending, average order value), a 7-day trend, top 5 items, recent orders. One `GET /stats/summary` call. First impression, so it gets polish time.

**Orders** — filter bar (status, channel, date range, search) → `Table` → row click opens a right-hand `Drawer` with the receipt breakdown, customer, timeline, and the valid Actions as buttons derived from `ORDER_TRANSITIONS`. "New Order" opens a large `Modal`: item picker grouped by category, quantity steppers, a **client-side estimated total**, optional customer, channel. On submit the server's authoritative figures replace the estimate — the estimate is a courtesy, never the source of truth.

**Menu** — categories in a sidebar or tab strip, items in a table with inline availability `Switch` (optimistic, with rollback on failure), create/edit in a Modal.

**CRM** — customer table with order count and Lifetime Spend, detail drawer with recent orders. Mostly read-only, and honest about it.

**Settings** — one form, sectioned: ordering (prep time, auto-accept), channels (three switches + delivery fee), opening hours (per-day rows), financial (tax rate, currency, timezone). Dirty-state tracking, save/discard.

**UI Library** — §9.4.

### 10.3 States

Every data-driven surface implements four states, using shared primitives so they look identical everywhere: **loading** (Skeleton shaped like the eventual content, not a spinner), **empty** (EmptyState with an action, e.g. "No orders yet → New Order"), **error** (ErrorState with a retry that calls React Query's `refetch`), **data**.

Mutations give feedback through `Toast`. Optimistic updates are used for availability toggles and Order Actions, with rollback on error.

---

## 11. Testing

Vitest across the whole repo. Targeted, not exhaustive — the brief asks for discipline, not coverage.

### 11.1 Backend — against real Postgres

**PGlite**: Postgres compiled to WebAssembly, running inside the test process. Real Postgres semantics (so constraints, transactions and SQL are genuinely exercised), no Docker, no setup — `pnpm test` works on a fresh clone. Migrations run against a fresh instance per test file.

Cases, each traceable to a sentence in the brief:

1. Create order computes subtotal/tax/total server-side, matching the §5.3 worked example.
2. Create order **ignores** price fields injected into the request body.
3. Create order rejects an unavailable Menu Item, naming it.
4. Create order rejects a disabled Channel.
5. Create order rejects outside Opening Hours.
6. Auto-accept lands the order in `accepted` instead of `pending`.
7. Order Items store frozen name and price; changing the Menu Item afterwards doesn't alter the Order.
8. Every legal transition succeeds and persists.
9. Illegal transitions (`complete` a `pending` order; any Action on a `cancelled` one) return `409`.
10. Cancel requires a reason.
11. Order creation is atomic — a failure mid-way leaves no partial Order.

### 11.2 Frontend

- `ORDER_TRANSITIONS` helpers — the highest-value test in the repo, because it's the one piece of logic shared across the wire.
- `formatMoney` — including the rounding boundary from §5.3.
- One component test proving a list renders loading → empty → error → data, with the generated hook mocked at the fetcher boundary.

---

## 12. Scripts

```bash
pnpm dev              # turbo: backend + dashboard together
pnpm dev:backend      # wrangler dev            → :8787
pnpm dev:dashboard    # expo start --web        → :8081
pnpm db:up            # docker compose up postgres (local fallback)
pnpm db:generate      # drizzle-kit generate — schema diff → SQL migration
pnpm db:migrate       # apply migrations
pnpm db:seed          # deterministic seed data
pnpm db:reset         # drop, migrate, seed
pnpm gen:contract     # write openapi.json, then run Orval
pnpm lint
pnpm typecheck
pnpm test
```

**`gen:contract` in detail.** A script imports the Hono app (no server needed), calls its OpenAPI document generator, writes `services/backend/openapi.json`, then runs Orval to regenerate `packages/api-client/src/generated/`. Both outputs are **committed**. That gives three things: a reviewer can read the contract without booting anything; the command is deterministic; and CI can run `pnpm gen:contract && git diff --exit-code` to prove the committed contract matches the schema. That last check is the mechanism that makes the whole architecture claim verifiable rather than aspirational.

---

## 13. Seed data

`pnpm db:seed` produces a restaurant that looks alive, because a reviewer's first impression is whatever this generates:

~6 categories, ~30 Menu Items with real dish names and plausible prices (a few deliberately unavailable), ~15 Customers, ~60 Orders spread across the last 30 days — every status represented, all three channels, several walk-ins, a few cancellations with reasons, and a realistic long-tail spend distribution so CRM has variety.

**Deterministic**: a fixed PRNG seed, and dates computed relative to run time. Same command, same shape, every time — which keeps screenshots and any data-dependent test stable.

---

## 14. Scope

### Explicitly out

| Not building | Why |
|---|---|
| **Authentication** | Not in the requirements or the evaluation criteria. Half-built auth costs hours and scores nothing. |
| **Item modifiers** (size, extras, "no onions") | The classic restaurant scope trap: one clean join becomes three tables with their own pricing rules. A free-text `notes` per Order Item covers the demo need. The README describes how it would be modelled. |
| **Multi-tenancy** | One restaurant, one Settings row. Multi-tenancy touches every query. |
| **Realtime / websockets** | React Query polling on the Orders screen gives the same feel for a fraction of the cost. |
| **Payments, refunds, delivery tracking** | Whole domains, unrequested. |
| **Charting library** | The 7-day trend is a hand-rolled bar row from tokens. A charting dependency under React Native Web is a time sink. |

### Known trade-offs, to be stated in the README

- Revenue exceeds the sum of Lifetime Spend, because walk-in Orders belong to no Customer. Intentional (§4.4).
- Deleting a Menu Item archives it rather than removing it, to preserve historical Order links.
- No pagination on CRM — the seeded dataset doesn't need it, and Orders demonstrates the pattern.
- Native (iOS/Android) is a bonus, attempted only if the web build is finished and polished.

### Stretch, in priority order

1. **Dark mode** — the strongest available proof that the tokens are systematic rather than decorative.
2. **CI** — GitHub Actions: lint, typecheck, test, and the contract-in-sync check.
3. **Deployed URL** — Worker on Cloudflare, dashboard as a static web build.
4. **Optimistic Order Actions.**
5. **Home sparklines.**
6. **Native build.**

---

## 15. How AI was used — and how it was constrained

The brief states outright that it is grading *how well AI was used*: "setting good guardrails, steering it clearly, reviewing output critically". That is a graded deliverable, so it needs an artifact, not a claim. The artifact is this repo's `docs/` directory and its commit history.

**The guardrails, in the order they were built:**

1. **A glossary before any code** — `CONTEXT.md` fixes the vocabulary. Without it, an AI will happily call the same thing an order, a ticket, and a transaction in three files.
2. **Decisions recorded as ADRs, with the rejected options** — so the reasoning survives, and so a later session cannot quietly reverse a deliberate choice by "fixing" it.
3. **This spec, written before implementation** — every rule paired with why it exists and what breaks without it. Ambiguity in a spec is where generated code invents things.
4. **A task-by-task plan with the tests written first** — each task has a failing test, an expected failure message, and an implementation. The test is the acceptance criterion, so "it looks done" is never the standard.
5. **Mechanical enforcement over good intentions** — the constraints that matter are checked by machines, not remembered: `pnpm gen:contract && git diff --exit-code` in CI proves the contract is generated rather than hand-maintained; the light/dark token parity test proves the theme is centralised; the transition tests iterate the shared map rather than restating it; `noUncheckedIndexedAccess` catches a whole class of list bugs.

**The steering method:** the design was settled through an adversarial questioning pass — each decision put as an explicit choice with a recommendation and a stated trade-off, answered one at a time, before a line of code existed. Decisions that were accepted by default rather than actively chosen were flagged as such (for instance, that a `ready` Order cannot be cancelled).

**What this is designed to avoid:** the failure mode the brief names — "generic or poorly integrated AI-generated work". Generic output comes from generic instructions. Every constraint in this document exists to make the correct implementation the only one that satisfies it.

The README carries a condensed version of this section, because it is part of what is being assessed.

---

## 16. How this maps to the evaluation criteria

| Criterion | Where it's answered |
|---|---|
| Fidelity to the stack | §3 — every named technology used for its intended job, no substitutions |
| Design system quality | §9 — semantic tokens, dark mode as proof, UI Library route |
| Component reusability | §9.3, §10.1 — primitives take no business types; strict layering |
| Visual polish / UX | §10.2, §10.3 — four states everywhere, drawers and modals, optimistic updates |
| Backend modelling / API design | §4, §6, §8 — snapshotting, the validation pipeline, uniform envelopes |
| Type safety / contract discipline | §2.2, §12 — generated client, committed spec, CI in-sync check |
| End-to-end integration | §7.2 — one transition map governs both the UI's buttons and the server's rules |
| Testing rigor | §11 — real Postgres via PGlite, each case traceable to the brief |
| Speed / scope management | §14 — explicit out-of-scope list with reasons |
| Quality of AI usage | §15 — glossary, ADRs, spec and plan written before code; constraints enforced by CI and tests rather than by intention |
