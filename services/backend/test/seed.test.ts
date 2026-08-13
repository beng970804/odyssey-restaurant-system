import { afterAll, beforeAll, expect, it } from 'vitest'
import { ORDER_STATUSES } from '@repo/types'
import { customers, orders } from '../src/db/schema'
import { seed } from '../src/db/seed'
import { createTestDb, type TestDb } from './helpers/db'

let db: TestDb
let cleanup: () => Promise<void>

beforeAll(async () => {
  ;({ db, cleanup } = await createTestDb())
})

afterAll(async () => {
  await cleanup()
})

/** The money shape of a seeded restaurant, independent of random UUIDs and run time. */
async function moneyShape(target: TestDb): Promise<string> {
  const rows = await target.select().from(orders)
  return rows
    .map((o) => `${o.subtotalCents}:${o.taxCents}:${o.deliveryFeeCents}:${o.totalCents}`)
    .toSorted()
    .join(',')
}

it('is deterministic — the same seed produces the same money, every run', async () => {
  // The invariant most likely to break silently. A PRNG that picks up an
  // unseeded source still produces a plausible-looking restaurant, so counts
  // and status coverage would stay green while screenshots and any
  // data-dependent test started drifting.
  const first = await seed(db)
  const firstShape = await moneyShape(db)

  const second = await seed(db)
  const secondShape = await moneyShape(db)

  expect(secondShape).toBe(firstShape)
  expect(second).toEqual(first)
})

it('is idempotent — re-seeding replaces rather than duplicating', async () => {
  await seed(db)
  expect(await db.select().from(orders)).toHaveLength(60)
  expect(await db.select().from(customers)).toHaveLength(15)
})

it('spreads lifetime spend across a long tail rather than evenly', async () => {
  await seed(db)
  const rows = await db.select().from(orders)

  // Counted by order, not by spend: item prices vary enough that spend alone
  // produces a top-heavy ranking even from a uniform picker. Counts isolate
  // the picker, which is the thing under test.
  const ordersPerCustomer = new Map<string, number>()
  for (const order of rows) {
    if (!order.customerId) continue
    ordersPerCustomer.set(order.customerId, (ordersPerCustomer.get(order.customerId) ?? 0) + 1)
  }

  const counts = [...ordersPerCustomer.values()].toSorted((a, b) => b - a)
  const attributed = counts.reduce((a, b) => a + b, 0)
  const topThreeShare = counts.slice(0, 3).reduce((a, b) => a + b, 0) / attributed

  // Uniform over 15 customers puts the top three at ~20%. The Zipf weighting
  // puts them near 55%. 40% cleanly separates the two.
  expect(topThreeShare).toBeGreaterThan(0.4)
})

it('keeps live orders recent and terminal orders historical', async () => {
  await seed(db)
  const rows = await db.select().from(orders)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (const order of rows) {
    const ageDays = (now - order.placedAt.getTime()) / dayMs
    if (order.status === 'completed' || order.status === 'cancelled') {
      expect(ageDays).toBeLessThanOrEqual(30)
    } else {
      // A month-old order still sitting in `pending` is not a restaurant that
      // looks alive.
      expect(ageDays).toBeLessThanOrEqual(1)
    }
  }
})

it('represents every status, every channel, walk-ins and cancellation reasons', async () => {
  await seed(db)
  const rows = await db.select().from(orders)

  expect(new Set(rows.map((o) => o.status))).toEqual(new Set(ORDER_STATUSES))
  expect(new Set(rows.map((o) => o.channel)).size).toBe(3)
  expect(rows.filter((o) => o.customerId === null).length).toBeGreaterThan(0)
  expect(
    rows.filter((o) => o.status === 'cancelled').every((o) => o.cancellationReason !== null),
  ).toBe(true)
})

it('computes money the way the API does', async () => {
  await seed(db)
  const rows = await db.select().from(orders)

  for (const o of rows) {
    expect(o.totalCents).toBe(o.subtotalCents + o.taxCents + o.deliveryFeeCents)
    expect(o.taxCents).toBe(Math.round((o.subtotalCents * 9) / 100))
    if (o.channel !== 'delivery') expect(o.deliveryFeeCents).toBe(0)
  }
})
