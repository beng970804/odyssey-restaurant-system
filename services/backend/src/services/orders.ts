import {
  and,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm'
import { addMinutes, calcTaxCents, isWithinOpeningHours, sumCents } from '@repo/shared'
import {
  getAvailableActions,
  resolveTransition,
  type OrderAction,
  type OrderChannel,
} from '@repo/types'
import { customers, menuItems, orderItems, orders } from '../db/schema'
import { AppError } from '../lib/errors'
import { getSettings } from './settings'
import type { CreateOrderInput, OrderQuery } from '../schemas/orders'
import type { Db } from '../db/client'

export async function getOrderDetail(db: Db, id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) return null

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))

  const customer = order.customerId
    ? ((await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1))[0] ??
      null)
    : null

  return { ...order, items, customer }
}

export async function requireOrderDetail(db: Db, id: string) {
  const order = await getOrderDetail(db, id)
  if (!order) throw new AppError('NOT_FOUND', `No order with id ${id}`, 404)
  return order
}

/**
 * One query for the page and one for the total. The item count is a correlated
 * subquery rather than a join, so grouping cannot distort the row set.
 */
export async function listOrders(db: Db, query: OrderQuery) {
  const filters: SQL[] = []
  if (query.status) filters.push(eq(orders.status, query.status))
  if (query.channel) filters.push(eq(orders.channel, query.channel))
  if (query.from) filters.push(gte(orders.placedAt, new Date(query.from)))
  if (query.to) filters.push(lte(orders.placedAt, new Date(query.to)))

  if (query.search) {
    const orderNumber = Number(query.search)
    filters.push(
      // A digits-only search is an order number; anything else is a customer.
      Number.isInteger(orderNumber)
        ? eq(orders.orderNumber, orderNumber)
        : ilike(customers.name, `%${query.search}%`),
    )
  }

  const where = and(...filters)
  const itemCount = sql<number>`(select count(*) from ${orderItems} where ${orderItems.orderId} = ${orders.id})::int`

  const [rows, [totals]] = await Promise.all([
    db
      .select({ ...getTableColumns(orders), customerName: customers.name, itemCount })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(where),
  ])

  return { rows, total: totals?.total ?? 0 }
}

/**
 * Five routes, one function — they differ only in path, operationId and whether
 * they carry a reason. Staff perform Actions; the status is a consequence the
 * server derives from the shared map, never a field the client sets (ADR 0004).
 */
export async function performAction(
  db: Db,
  orderId: string,
  action: OrderAction,
  reason?: string,
  now = new Date(),
) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new AppError('NOT_FOUND', `No order with id ${orderId}`, 404)

  const next = resolveTransition(order.status, action)
  if (!next) {
    // 409 rather than 400: the request is well-formed, the state is not.
    throw new AppError(
      'INVALID_TRANSITION',
      `Cannot ${action} an order that is ${order.status}`,
      409,
      { currentStatus: order.status, allowedActions: getAvailableActions(order.status) },
    )
  }

  await db
    .update(orders)
    .set({
      status: next,
      updatedAt: now,
      ...(action === 'cancel' ? { cancellationReason: reason } : {}),
    })
    .where(eq(orders.id, orderId))

  return requireOrderDetail(db, orderId)
}

/**
 * Spec §6's pipeline, in order, stopping at the first failure. Steps 2, 3, 5, 7
 * and 8 all read settings — five behaviours driven by one page.
 */
export async function createOrder(db: Db, input: CreateOrderInput, now = new Date()) {
  const settings = await getSettings(db)

  // 2. Channel enabled? Refusing delivery when delivery is off is a business
  // rule, not a form validation.
  const channelEnabled: Record<OrderChannel, boolean> = {
    dine_in: settings.dineInEnabled,
    takeaway: settings.takeawayEnabled,
    delivery: settings.deliveryEnabled,
  }
  if (!channelEnabled[input.channel]) {
    throw new AppError(
      'CHANNEL_DISABLED',
      `Ordering is currently unavailable for ${input.channel}`,
      422,
    )
  }

  // 3. Open? Compared in the settings timezone — a Worker's clock is UTC and
  // the restaurant's hours are not.
  if (!isWithinOpeningHours(now, settings.openingHours, settings.timezone)) {
    throw new AppError('OUTSIDE_OPENING_HOURS', 'The restaurant is closed', 422)
  }

  // 4. Every item exists and is not archived.
  const ids = input.items.map((i) => i.menuItemId)
  const rows = await db
    .select()
    .from(menuItems)
    .where(and(inArray(menuItems.id, ids), eq(menuItems.isArchived, false)))
  const byId = new Map(rows.map((r) => [r.id, r]))
  const missing = ids.filter((id) => !byId.has(id))
  if (missing.length > 0) {
    throw new AppError('NOT_FOUND', 'One or more menu items do not exist', 404, { missing })
  }

  // 5. Every item is available — named, so the UI can highlight the offending
  // lines rather than showing a generic error.
  const unavailable = rows.filter((r) => !r.isAvailable)
  if (unavailable.length > 0) {
    throw new AppError('ITEM_UNAVAILABLE', 'One or more items are unavailable', 422, {
      unavailableItems: unavailable.map((r) => ({ id: r.id, name: r.name })),
    })
  }

  // 6. Money, from server-side prices only. Name and price are frozen onto the
  // line here (ADR 0001), so later menu edits cannot rewrite order history.
  const lines = input.items.map((i) => {
    const item = byId.get(i.menuItemId)!
    return {
      menuItemId: item.id,
      nameSnapshot: item.name,
      unitPriceCents: item.priceCents,
      quantity: i.quantity,
      notes: i.notes ?? null,
    }
  })
  const subtotalCents = sumCents(lines.map((l) => l.unitPriceCents * l.quantity))
  const deliveryFeeCents = input.channel === 'delivery' ? settings.deliveryFeeCents : 0
  // Rounded once, on the subtotal only — never on the delivery fee (spec §5.3).
  const taxCents = calcTaxCents(subtotalCents, settings.taxRatePercent)
  const totalCents = subtotalCents + taxCents + deliveryFeeCents

  // 7 and 8.
  const status = settings.autoAcceptOrders ? 'accepted' : 'pending'
  const estimatedReadyAt = addMinutes(now, settings.defaultPrepTimeMinutes)

  // 9. One transaction: an order with no items, or items with no order, is
  // corrupt data. It is one atomic fact.
  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: input.customerId ?? null,
        channel: input.channel,
        status,
        subtotalCents,
        taxCents,
        deliveryFeeCents,
        totalCents,
        notes: input.notes ?? null,
        estimatedReadyAt,
        placedAt: now,
        updatedAt: now,
      })
      .returning({ id: orders.id })

    await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order!.id })))
    return order!.id
  })

  return requireOrderDetail(db, orderId)
}
