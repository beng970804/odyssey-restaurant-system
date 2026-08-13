import { createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { ORDER_CHANNELS, ORDER_STATUSES } from '@repo/types'
import { orderItems, orders } from '../db/schema'
import { customerSchema } from './customers'
import { isoDateTime } from './common'

/**
 * Note what is absent: no price, no total, no status. The client cannot express
 * them, so it cannot influence them — the "never trust the client for money"
 * rule enforced by the schema rather than by a check someone has to remember.
 */
export const createOrderSchema = z
  .object({
    channel: z.enum(ORDER_CHANNELS).openapi({ example: 'takeaway' }),
    customerId: z.uuid().nullish(),
    notes: z.string().max(500).nullish(),
    items: z
      .array(
        z.object({
          menuItemId: z.uuid(),
          quantity: z.number().int().positive().max(99),
          notes: z.string().max(200).nullish(),
        }),
      )
      .min(1, 'An order must contain at least one item'),
  })
  .openapi('CreateOrder')

export type CreateOrderInput = z.infer<typeof createOrderSchema>

/** Cancelling is the one Action that carries a payload — a reason is required. */
export const cancelOrderSchema = z
  .object({ reason: z.string().min(1, 'A reason is required').max(500) })
  .openapi('CancelOrder')

export const orderItemSchema = createSelectSchema(orderItems).openapi('OrderItem')

export const orderSchema = createSelectSchema(orders, {
  placedAt: isoDateTime,
  updatedAt: isoDateTime,
  estimatedReadyAt: isoDateTime.nullable(),
}).openapi('Order')

export const orderDetailSchema = orderSchema
  .extend({
    items: z.array(orderItemSchema),
    customer: customerSchema.nullable(),
  })
  .openapi('OrderDetail')

/**
 * The list row carries the customer name and item count so the orders table
 * renders from one request instead of an N+1 per row.
 */
export const orderRowSchema = orderSchema
  .extend({
    customerName: z.string().nullable(),
    itemCount: z.number().int(),
  })
  .openapi('OrderRow')

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  channel: z.enum(ORDER_CHANNELS).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  /** An order number, or part of a customer's name. */
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Capped: an uncapped page size is an easy way to ask for the whole table.
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export type OrderQuery = z.infer<typeof orderQuerySchema>

export const orderListSchema = z
  .object({
    data: z.array(orderRowSchema),
    meta: z.object({
      total: z.number().int(),
      page: z.number().int(),
      pageSize: z.number().int(),
    }),
  })
  .openapi('OrderList')
