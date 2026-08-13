import { desc, eq, gte, ne, sql } from 'drizzle-orm'
import { localDateKey } from '@repo/shared'
import { menuItems, orderItems, orders } from '../db/schema'
import { getSettings } from './settings'
import type { Db } from '../db/client'

const TREND_DAYS = 7
const TOP_ITEM_LIMIT = 5

/**
 * A "day" here is a Singapore day, not a UTC day: an order placed at 17:00 UTC
 * belongs to the next local day. Buckets are computed with the same
 * `localDateKey` the rest of the system uses rather than hand-written
 * `AT TIME ZONE` SQL, so there is one timezone implementation in the codebase.
 */
export async function getStatsSummary(db: Db, now = new Date()) {
  const settings = await getSettings(db)

  // The window starts at the beginning of the earliest local day on the chart,
  // so a day is never half-counted. Two days of slack covers the offset.
  const windowStart = new Date(now.getTime() - (TREND_DAYS + 1) * 24 * 60 * 60 * 1000)

  const [[totals], [pending], topItems, recent] = await Promise.all([
    db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        earningOrders: sql<number>`count(*) filter (where ${orders.status} <> 'cancelled')::int`,
        revenueCents: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)::int`,
      })
      .from(orders),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'pending')),

    // Grouped by menuItemId alone — the reporting key. Grouping by the frozen
    // nameSnapshot too would split one dish into two rows the moment it is
    // renamed, and could drop the real bestseller out of the top five. The
    // name shown is therefore the item's current name, not the snapshot.
    db
      .select({
        menuItemId: orderItems.menuItemId,
        name: menuItems.name,
        quantitySold: sql<number>`sum(${orderItems.quantity})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(ne(orders.status, 'cancelled'))
      .groupBy(orderItems.menuItemId, menuItems.name)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(TOP_ITEM_LIMIT),

    db
      .select({ placedAt: orders.placedAt, totalCents: orders.totalCents, status: orders.status })
      .from(orders)
      .where(gte(orders.placedAt, windowStart)),
  ])

  const revenueCents = totals?.revenueCents ?? 0
  const earningOrders = totals?.earningOrders ?? 0

  // Emit a row for every day, including empty ones, or the chart has gaps.
  const trend = new Map(
    Array.from({ length: TREND_DAYS }, (_, i) => {
      const day = new Date(now.getTime() - (TREND_DAYS - 1 - i) * 24 * 60 * 60 * 1000)
      return [localDateKey(day, settings.timezone), { orderCount: 0, revenueCents: 0 }]
    }),
  )

  for (const order of recent) {
    const bucket = trend.get(localDateKey(order.placedAt, settings.timezone))
    if (!bucket) continue
    bucket.orderCount += 1
    if (order.status !== 'cancelled') bucket.revenueCents += order.totalCents
  }

  return {
    totalOrders: totals?.totalOrders ?? 0,
    revenueCents,
    pendingOrders: pending?.count ?? 0,
    // Guarded: sum / 0 is NaN, which serialises to null and renders as a blank
    // KPI card.
    averageOrderValueCents: earningOrders === 0 ? 0 : Math.round(revenueCents / earningOrders),
    topItems,
    dailyTrend: [...trend].map(([date, counts]) => ({ date, ...counts })),
  }
}
