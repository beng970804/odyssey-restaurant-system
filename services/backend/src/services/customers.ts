import { desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm'
import { customers, orders } from '../db/schema'
import type { Db } from '../db/client'

const RECENT_ORDER_LIMIT = 20

/**
 * The `::int` casts are load-bearing: Postgres returns count() and sum() as
 * bigint, which arrives in JavaScript as a *string*. Without them
 * `lifetimeSpendCents` reaches the frontend as "4820" and every calculation
 * downstream silently concatenates instead of adding.
 */
const orderCount = sql<number>`count(${orders.id})::int`
const lifetimeSpendCents = sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)::int`

/**
 * Cancelled orders still count as history — a customer who cancels twice a
 * month is worth seeing — but they contribute no money, so the two aggregates
 * deliberately disagree.
 */
export function listCustomers(db: Db, search?: string) {
  return (
    db
      .select({ ...getTableColumns(customers), orderCount, lifetimeSpendCents })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(search ? ilike(customers.name, `%${search}%`) : undefined)
      .groupBy(customers.id)
      // Ordered by the expression rather than by its output alias: Drizzle names
      // the column "lifetimeSpendCents", so a snake_case alias would not resolve.
      .orderBy(desc(lifetimeSpendCents), customers.name)
  )
}

export async function getCustomer(db: Db, id: string) {
  const [customer] = await db
    .select({ ...getTableColumns(customers), orderCount, lifetimeSpendCents })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(eq(customers.id, id))
    .groupBy(customers.id)
    .limit(1)

  if (!customer) return null

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      channel: orders.channel,
      totalCents: orders.totalCents,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.placedAt))
    .limit(RECENT_ORDER_LIMIT)

  return { ...customer, recentOrders }
}
