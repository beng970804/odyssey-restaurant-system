import { and, desc, eq, inArray } from 'drizzle-orm'
import { addMinutes, calcTaxCents, isWithinOpeningHours, sumCents } from '@repo/shared'
import type { OrderChannel } from '@repo/types'
import { customers, menuItems, orderItems, orders } from '../db/schema'
import { AppError } from '../lib/errors'
import { getSettings } from './settings'
import type { CreateOrderInput } from '../schemas/orders'
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

/** Filtering and pagination arrive in Task 13. */
export function listOrders(db: Db) {
  return db.select().from(orders).orderBy(desc(orders.placedAt))
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
