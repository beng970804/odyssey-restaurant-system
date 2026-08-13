import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { customers } from '../db/schema'
import {
  createCustomerSchema,
  customerDetailSchema,
  customerListSchema,
  customerQuerySchema,
  customerWithStatsSchema,
  updateCustomerSchema,
} from '../schemas/customers'
import { toIsoDates } from '../schemas/common'
import { getCustomer, listCustomers } from '../services/customers'
import { AppError, errorSchema } from '../lib/errors'
import type { App } from '../app'
import type { Db } from '../db/client'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

const idParamSchema = z.object({ id: z.uuid() })

/** A written row still has to come back carrying its aggregates. */
async function requireCustomerWithStats(db: Db, id: string) {
  const customer = await getCustomer(db, id)
  if (!customer) throw new AppError('NOT_FOUND', `No customer with id ${id}`, 404)
  const { recentOrders: _recentOrders, ...withStats } = customer
  return withStats
}

export function registerCustomerRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/customers',
      operationId: 'listCustomers',
      tags: ['CRM'],
      request: { query: customerQuerySchema },
      responses: {
        200: {
          description: 'Customers with order count and lifetime spend',
          content: { 'application/json': { schema: customerListSchema } },
        },
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const rows = await listCustomers(c.get('db'), c.req.valid('query').search)
      return c.json({ data: rows.map(toIsoDates), meta: { total: rows.length } }, 200)
    },
  )

  app.openapi(
    createRoute({
      method: 'get',
      path: '/customers/{id}',
      operationId: 'getCustomer',
      tags: ['CRM'],
      request: { params: idParamSchema },
      responses: {
        200: {
          description: 'Customer with recent order history',
          content: { 'application/json': { schema: customerDetailSchema } },
        },
        404: errorResponse('Customer not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const customer = await getCustomer(c.get('db'), id)
      if (!customer) throw new AppError('NOT_FOUND', `No customer with id ${id}`, 404)

      return c.json(
        { ...toIsoDates(customer), recentOrders: customer.recentOrders.map(toIsoDates) },
        200,
      )
    },
  )

  app.openapi(
    createRoute({
      method: 'post',
      path: '/customers',
      operationId: 'createCustomer',
      tags: ['CRM'],
      request: {
        body: { content: { 'application/json': { schema: createCustomerSchema } }, required: true },
      },
      responses: {
        201: {
          description: 'Customer created',
          content: { 'application/json': { schema: customerWithStatsSchema } },
        },
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const [row] = await db
        .insert(customers)
        .values(c.req.valid('json'))
        .returning({ id: customers.id })
      return c.json(toIsoDates(await requireCustomerWithStats(db, row!.id)), 201)
    },
  )

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/customers/{id}',
      operationId: 'updateCustomer',
      tags: ['CRM'],
      request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: updateCustomerSchema } }, required: true },
      },
      responses: {
        200: {
          description: 'Customer updated',
          content: { 'application/json': { schema: customerWithStatsSchema } },
        },
        404: errorResponse('Customer not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')
      const [row] = await db
        .update(customers)
        .set(c.req.valid('json'))
        .where(eq(customers.id, id))
        .returning({ id: customers.id })
      if (!row) throw new AppError('NOT_FOUND', `No customer with id ${id}`, 404)

      return c.json(toIsoDates(await requireCustomerWithStats(db, id)), 200)
    },
  )
}
