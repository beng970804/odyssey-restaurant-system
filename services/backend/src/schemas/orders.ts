import { createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { ORDER_CHANNELS } from '@repo/types'
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

/** Extended with filters and pagination in Task 13. */
export const orderListSchema = z
  .object({
    data: z.array(orderSchema),
    meta: z.object({ total: z.number().int() }),
  })
  .openapi('OrderList')
