import { createRoute, z } from '@hono/zod-openapi'
import { createOrderSchema, orderDetailSchema, orderListSchema } from '../schemas/orders'
import { toIsoDates } from '../schemas/common'
import { createOrder, listOrders, requireOrderDetail } from '../services/orders'
import { errorSchema } from '../lib/errors'
import type { App } from '../app'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

const idParamSchema = z.object({ id: z.uuid() })

/** Timestamps live on the order, its items and its customer alike. */
function serialiseOrder(order: Awaited<ReturnType<typeof requireOrderDetail>>) {
  return {
    ...toIsoDates(order),
    items: order.items.map(toIsoDates),
    customer: order.customer ? toIsoDates(order.customer) : null,
  }
}

export function registerOrderRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/orders',
      operationId: 'createOrder',
      tags: ['Orders'],
      request: {
        body: { content: { 'application/json': { schema: createOrderSchema } }, required: true },
      },
      responses: {
        201: {
          description: 'Order placed',
          content: { 'application/json': { schema: orderDetailSchema } },
        },
        404: errorResponse('A menu item does not exist'),
        422: errorResponse('The order was refused'),
      },
    }),
    async (c) => c.json(serialiseOrder(await createOrder(c.get('db'), c.req.valid('json'))), 201),
  )

  app.openapi(
    createRoute({
      method: 'get',
      path: '/orders',
      operationId: 'listOrders',
      tags: ['Orders'],
      responses: {
        200: {
          description: 'Orders, newest first',
          content: { 'application/json': { schema: orderListSchema } },
        },
      },
    }),
    async (c) => {
      const rows = await listOrders(c.get('db'))
      return c.json({ data: rows.map(toIsoDates), meta: { total: rows.length } }, 200)
    },
  )

  app.openapi(
    createRoute({
      method: 'get',
      path: '/orders/{id}',
      operationId: 'getOrder',
      tags: ['Orders'],
      request: { params: idParamSchema },
      responses: {
        200: {
          description: 'Order with its items and customer',
          content: { 'application/json': { schema: orderDetailSchema } },
        },
        404: errorResponse('Order not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) =>
      c.json(serialiseOrder(await requireOrderDetail(c.get('db'), c.req.valid('param').id)), 200),
  )
}
