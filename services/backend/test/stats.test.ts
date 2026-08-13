import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seedMinimal } from './helpers/fixtures'
import { seed } from '../src/db/seed'

// Thursday, matching Task 11's fixed clock, so the seven-day window is
// deterministic.
const NOW = new Date('2026-08-13T06:00:00Z')

type Summary = {
  totalOrders: number
  revenueCents: number
  pendingOrders: number
  averageOrderValueCents: number
  topItems: { menuItemId: string; name: string; quantitySold: number }[]
  dailyTrend: { date: string; orderCount: number; revenueCents: number }[]
}

describe('GET /stats/summary', () => {
  let db: TestDb
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createTestApp>

  beforeEach(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    const testDb = await createTestDb()
    db = testDb.db
    cleanup = testDb.cleanup
    app = createTestApp(db)
  })

  afterEach(async () => {
    vi.useRealTimers()
    await cleanup()
  })

  const summary = async (): Promise<Summary> => {
    const res = await app.request('/stats/summary')
    expect(res.status).toBe(200)
    return (await res.json()) as Summary
  }

  describe('against the full seed', () => {
    beforeEach(async () => {
      await seed(db)
    })

    it('counts every order but excludes cancelled ones from revenue', async () => {
      const stats = await summary()
      const orders = (await (await app.request('/orders?pageSize=100')).json()) as {
        data: { status: string; totalCents: number }[]
      }

      expect(stats.totalOrders).toBe(orders.data.length)
      expect(stats.revenueCents).toBe(
        orders.data
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + o.totalCents, 0),
      )
    })

    it('counts orders still awaiting a decision', async () => {
      const stats = await summary()
      const pending = (await (await app.request('/orders?status=pending&pageSize=100')).json()) as {
        meta: { total: number }
      }
      expect(stats.pendingOrders).toBe(pending.meta.total)
    })

    it('averages revenue over the orders that earned it', async () => {
      const stats = await summary()
      const nonCancelled = (await (await app.request('/orders?pageSize=100')).json()) as {
        data: { status: string }[]
      }
      const earning = nonCancelled.data.filter((o) => o.status !== 'cancelled').length
      expect(stats.averageOrderValueCents).toBe(Math.round(stats.revenueCents / earning))
    })

    it('returns at most five top items, sorted descending', async () => {
      const { topItems } = await summary()
      expect(topItems.length).toBeGreaterThan(0)
      expect(topItems.length).toBeLessThanOrEqual(5)

      const sold = topItems.map((i) => i.quantitySold)
      expect(sold).toEqual(sold.toSorted((a, b) => b - a))
      expect(topItems[0]!.name).toBeTruthy()
    })

    it('returns exactly seven days of trend data, oldest first', async () => {
      const { dailyTrend } = await summary()
      expect(dailyTrend).toHaveLength(7)
      expect(dailyTrend.at(-1)!.date).toBe('2026-08-13')
      expect(dailyTrend[0]!.date).toBe('2026-08-07')

      const dates = dailyTrend.map((d) => d.date)
      expect(dates).toEqual(dates.toSorted())
    })
  })

  describe('against a controlled fixture', () => {
    beforeEach(async () => {
      await seedMinimal(db)
    })

    it('reports zeroes rather than NaN when there are no orders', async () => {
      const stats = await summary()
      // sum / count with no orders is NaN, which serialises to null and renders
      // as a blank card. Handled here so no screen has to.
      expect(stats).toMatchObject({
        totalOrders: 0,
        revenueCents: 0,
        pendingOrders: 0,
        averageOrderValueCents: 0,
        topItems: [],
      })
      expect(stats.dailyTrend).toHaveLength(7)
      expect(stats.dailyTrend.every((d) => d.orderCount === 0 && d.revenueCents === 0)).toBe(true)
    })

    it('buckets trend days in the settings timezone, not UTC', async () => {
      // 17:00 UTC on the 12th is 01:00 on the 13th in Singapore, so it belongs
      // to the 13th.
      await fixtureOrder(db, new Date('2026-08-12T17:00:00Z'), 1000)

      const { dailyTrend } = await summary()
      expect(dailyTrend.find((d) => d.date === '2026-08-13')?.orderCount).toBe(1)
      expect(dailyTrend.find((d) => d.date === '2026-08-12')?.orderCount).toBe(0)
    })

    it('keeps cancelled orders out of the trend revenue but counts the order', async () => {
      await fixtureOrder(db, new Date('2026-08-13T02:00:00Z'), 1000)
      await fixtureOrder(db, new Date('2026-08-13T02:00:00Z'), 5000, 'cancelled')

      const stats = await summary()
      const today = stats.dailyTrend.find((d) => d.date === '2026-08-13')!
      expect(today.orderCount).toBe(2)
      expect(today.revenueCents).toBe(1000)
      expect(stats.revenueCents).toBe(1000)
    })

    it('ignores orders older than the window', async () => {
      await fixtureOrder(db, new Date('2026-07-01T02:00:00Z'), 9900)

      const stats = await summary()
      // Totals span all time; the trend spans seven days.
      expect(stats.totalOrders).toBe(1)
      expect(stats.dailyTrend.every((d) => d.orderCount === 0)).toBe(true)
    })
  })
})

async function fixtureOrder(db: TestDb, placedAt: Date, totalCents: number, status = 'completed') {
  const { orders } = await import('../src/db/schema')
  await db.insert(orders).values({
    channel: 'takeaway',
    status: status as 'completed',
    subtotalCents: totalCents,
    taxCents: 0,
    deliveryFeeCents: 0,
    totalCents,
    placedAt,
    updatedAt: placedAt,
  })
}
