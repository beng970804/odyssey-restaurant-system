import { createRoute } from '@hono/zod-openapi'
import { statsSummarySchema } from '../schemas/stats'
import { getStatsSummary } from '../services/stats'
import { errorResponse, internalErrorResponse } from '../lib/errors'
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
        404: errorResponse('Settings row is missing'),
        ...internalErrorResponse,
      },
    }),
    async (c) => c.json(await getStatsSummary(c.get('db')), 200),
  )
}
