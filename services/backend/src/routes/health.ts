import { createRoute, z } from '@hono/zod-openapi'
import type { App } from '../app'

const healthSchema = z.object({ status: z.literal('ok') }).openapi('Health')

export function registerHealthRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      // Not decoration: Orval names the generated hook from this.
      // `getHealth` becomes `useGetHealth()`.
      operationId: 'getHealth',
      tags: ['System'],
      responses: {
        200: {
          description: 'Service is healthy',
          content: { 'application/json': { schema: healthSchema } },
        },
      },
    }),
    (c) => c.json({ status: 'ok' as const }),
  )
}
