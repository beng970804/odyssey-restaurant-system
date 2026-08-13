import { createRoute, z } from '@hono/zod-openapi'
import type { OrderAction } from '@repo/types'
import {
  cancelOrderSchema,
  createOrderSchema,
  orderDetailSchema,
  orderListSchema,
  orderQuerySchema,
} from '../schemas/orders'
import { toIsoDates } from '../schemas/common'
import { createOrder, listOrders, performAction, requireOrderDetail } from '../services/orders'
import { errorSchema } from '../lib/errors'
import type { App } from '../app'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

const idParamSchema = z.object({ id: z.uuid() })

/**
 * The API exposes named business operations, not a status field — there is no
 * PATCH /orders/{id} { status }, so it cannot be misused (spec §7.1). Each
 * operationId becomes the generated hook: useAcceptOrder, useMarkOrderReady.
 *
 * Cancel is registered separately below rather than listed here, because it is
 * the one Action carrying a body — and a route whose `request` is assembled
 * conditionally loses the type that makes `c.req.valid('json')` safe.
 */
const ORDER_ACTION_ROUTES: {
  action: Exclude<OrderAction, 'cancel'>
  path: string
  operationId: string
  summary: string
}[] = [
  { action: 'accept', path: 'accept', operationId: 'acceptOrder', summary: 'Accept an order' },
  {
    action: 'startPreparing',
    path: 'start-preparing',
    operationId: 'startPreparingOrder',
    summary: 'Start preparing an order',
  },
  {
    action: 'markReady',
    path: 'mark-ready',
    operationId: 'markOrderReady',
    summary: 'Mark an order ready',
  },
  {
    action: 'complete',
    path: 'complete',
    operationId: 'completeOrder',
    summary: 'Complete an order',
  },
]

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
      request: { query: orderQuerySchema },
      responses: {
        200: {
          description: 'A page of orders, newest first',
          content: { 'application/json': { schema: orderListSchema } },
        },
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const query = c.req.valid('query')
      const { rows, total } = await listOrders(c.get('db'), query)
      return c.json(
        {
          data: rows.map(toIsoDates),
          meta: { total, page: query.page, pageSize: query.pageSize },
        },
        200,
      )
    },
  )

  const actionResponses = {
    200: {
      description: 'Order after the action',
      content: { 'application/json': { schema: orderDetailSchema } },
    },
    404: errorResponse('Order not found'),
    409: errorResponse('The order’s current status does not allow this action'),
    422: errorResponse('Validation failed'),
  }

  for (const { action, path, operationId, summary } of ORDER_ACTION_ROUTES) {
    app.openapi(
      createRoute({
        method: 'post',
        path: `/orders/{id}/${path}`,
        operationId,
        summary,
        tags: ['Orders'],
        request: { params: idParamSchema },
        responses: actionResponses,
      }),
      async (c) => {
        const order = await performAction(c.get('db'), c.req.valid('param').id, action)
        return c.json(serialiseOrder(order), 200)
      },
    )
  }

  app.openapi(
    createRoute({
      method: 'post',
      path: '/orders/{id}/cancel',
      operationId: 'cancelOrder',
      summary: 'Cancel an order',
      tags: ['Orders'],
      request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: cancelOrderSchema } }, required: true },
      },
      responses: actionResponses,
    }),
    async (c) => {
      const order = await performAction(
        c.get('db'),
        c.req.valid('param').id,
        'cancel',
        c.req.valid('json').reason,
      )
      return c.json(serialiseOrder(order), 200)
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
