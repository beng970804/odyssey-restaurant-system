import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { ORDER_CHANNELS, ORDER_STATUSES } from '@repo/types'
import { customers } from '../db/schema'
import { catalogQuerySchema, isoDateTime, listMetaSchema } from './common'

export const customerSchema = createSelectSchema(customers, {
  createdAt: isoDateTime,
}).openapi('Customer')

/**
 * `orderCount` and `lifetimeSpendCents` are query results, not columns, so they
 * are hand-written on top of the derived schema rather than derived themselves.
 */
export const customerWithStatsSchema = customerSchema
  .extend({
    orderCount: z.number().int(),
    lifetimeSpendCents: z.number().int(),
  })
  .openapi('CustomerWithStats')

/** Just enough of an order to render a history row; the full shape is Task 13's. */
export const customerOrderSummarySchema = z
  .object({
    id: z.uuid(),
    orderNumber: z.number().int(),
    status: z.enum(ORDER_STATUSES),
    channel: z.enum(ORDER_CHANNELS),
    totalCents: z.number().int(),
    placedAt: isoDateTime,
  })
  .openapi('CustomerOrderSummary')

export const customerDetailSchema = customerWithStatsSchema
  .extend({ recentOrders: z.array(customerOrderSummarySchema) })
  .openapi('CustomerDetail')

export const createCustomerSchema = createInsertSchema(customers, {
  name: (s) => s.min(1, 'Name is required'),
  email: (s) => s.email('Expected an email address'),
})
  .pick({ name: true, phone: true, email: true, notes: true })
  .openapi('CreateCustomer')

export const updateCustomerSchema = createCustomerSchema.partial().openapi('UpdateCustomer')

export const customerQuerySchema = z
  .object({ search: z.string().min(1).optional() })
  .extend(catalogQuerySchema.shape)

export const customerListSchema = z
  .object({ data: z.array(customerWithStatsSchema), meta: listMetaSchema })
  .openapi('CustomerList')
