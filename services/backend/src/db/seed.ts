import { calcTaxCents, sumCents } from '@repo/shared'
import type { OrderStatus } from '@repo/types'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { categories, customers, menuItems, orderItems, orders, settings } from './schema'
import type * as schema from './schema'
import {
  seedCancellationReasons,
  seedCategories,
  seedCustomers,
  seedMenuItems,
  seedOpeningHours,
  seedOrderNotes,
} from './seed-data'

type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>

export type SeedSummary = {
  categories: number
  menuItems: number
  customers: number
  orders: number
}

/**
 * Mulberry32 — small deterministic PRNG. Same seed, same restaurant, every
 * time, which keeps screenshots and any data-dependent test stable.
 */
function makeRng(initialSeed: number) {
  let state = initialSeed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ORDER_COUNT = 60
const DAYS_BACK = 30

// Weighted toward completed, because that is what a month of history looks
// like. Every status still appears.
const STATUS_WEIGHTS: [OrderStatus, number][] = [
  ['completed', 38],
  ['cancelled', 4],
  ['pending', 5],
  ['accepted', 4],
  ['preparing', 4],
  ['ready', 5],
]

const CHANNELS = ['dine_in', 'takeaway', 'delivery'] as const

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]!
}

function weightedStatuses(): OrderStatus[] {
  return STATUS_WEIGHTS.flatMap(([status, weight]) => Array<OrderStatus>(weight).fill(status))
}

export async function seed(db: SeedDb): Promise<SeedSummary> {
  const rng = makeRng(20260813)

  const insertedCategories = await db
    .insert(categories)
    .values(seedCategories.map((c) => ({ ...c })))
    .returning()

  const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]))

  const insertedMenuItems = await db
    .insert(menuItems)
    .values(
      seedMenuItems.map((item) => ({
        categoryId: categoryIdByName.get(item.category)!,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        isAvailable: item.isAvailable ?? true,
      })),
    )
    .returning()

  const insertedCustomers = await db.insert(customers).values(seedCustomers).returning()

  const [settingsRow] = await db
    .insert(settings)
    .values({ id: 1, openingHours: seedOpeningHours })
    .returning()

  const taxRatePercent = settingsRow!.taxRatePercent
  const deliveryFeeCents = settingsRow!.deliveryFeeCents
  const prepMinutes = settingsRow!.defaultPrepTimeMinutes

  // Only available items can be ordered — the same rule the API enforces.
  const orderableItems = insertedMenuItems.filter((i) => i.isAvailable)
  const statusPool = weightedStatuses()
  const now = Date.now()
  let cancellationIndex = 0

  for (let n = 0; n < ORDER_COUNT; n++) {
    const status = statusPool[n % statusPool.length]!
    const channel = pick(rng, CHANNELS)
    // ~20% walk-ins: an order that belongs to nobody, counting toward revenue
    // but appearing in no customer's history.
    const customer = rng() < 0.2 ? null : pick(rng, insertedCustomers)

    const placedAt = new Date(now - rng() * DAYS_BACK * 24 * 60 * 60 * 1000)

    const lineCount = 1 + Math.floor(rng() * 4)
    const chosen = Array.from({ length: lineCount }, () => pick(rng, orderableItems))
    const lines = chosen.map((item) => ({
      item,
      quantity: 1 + Math.floor(rng() * 3),
    }))

    // Computed with the same functions the API uses, so seeded orders are
    // indistinguishable from orders the API would have produced.
    const subtotalCents = sumCents(lines.map((l) => l.item.priceCents * l.quantity))
    const taxCents = calcTaxCents(subtotalCents, taxRatePercent)
    const orderDeliveryFeeCents = channel === 'delivery' ? deliveryFeeCents : 0
    const totalCents = subtotalCents + taxCents + orderDeliveryFeeCents

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customer?.id ?? null,
        channel,
        status,
        subtotalCents,
        taxCents,
        deliveryFeeCents: orderDeliveryFeeCents,
        totalCents,
        notes: pick(rng, seedOrderNotes),
        cancellationReason:
          status === 'cancelled'
            ? seedCancellationReasons[cancellationIndex++ % seedCancellationReasons.length]!
            : null,
        estimatedReadyAt: new Date(placedAt.getTime() + prepMinutes * 60_000),
        placedAt,
        updatedAt: placedAt,
      })
      .returning()

    await db.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order!.id,
        menuItemId: l.item.id,
        // Frozen at the moment the order was placed (ADR 0001).
        nameSnapshot: l.item.name,
        unitPriceCents: l.item.priceCents,
        quantity: l.quantity,
        notes: null,
      })),
    )
  }

  return {
    categories: insertedCategories.length,
    menuItems: insertedMenuItems.length,
    customers: insertedCustomers.length,
    orders: ORDER_COUNT,
  }
}
