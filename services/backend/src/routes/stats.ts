import { createRoute } from '@hono/zod-openapi'
import { statsSummarySchema } from '../schemas/stats'
import { getStatsSummary } from '../services/stats'
import { errorSchema } from '../lib/errors'
import type { App } from '../app'

export function registerStatsRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/stats/summary',
      operationId: 'getStatsSummary',
      tags: ['Stats'],
      responses: {
        200: {
          description: 'Headline numbers for the home screen',
          content: { 'application/json': { schema: statsSummarySchema } },
        },
        404: {
          description: 'Settings row is missing',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    }),
    async (c) => c.json(await getStatsSummary(c.get('db')), 200),
  )
}
