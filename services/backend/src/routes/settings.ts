import { createRoute } from '@hono/zod-openapi'
import { settingsSchema, updateSettingsSchema } from '../schemas/settings'
import { toIsoDates } from '../schemas/common'
import { getSettings, updateSettings } from '../services/settings'
import { errorResponse, internalErrorResponse } from '../lib/errors'
import type { App } from '../app'

export function registerSettingsRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/settings',
      operationId: 'getSettings',
      tags: ['Settings'],
      responses: {
        200: {
          description: 'The restaurant settings',
          content: { 'application/json': { schema: settingsSchema } },
        },
        404: errorResponse('Settings row is missing'),
        ...internalErrorResponse,
      },
    }),
    async (c) => c.json(toIsoDates(await getSettings(c.get('db'))), 200),
  )

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/settings',
      operationId: 'updateSettings',
      tags: ['Settings'],
      request: {
        body: { content: { 'application/json': { schema: updateSettingsSchema } }, required: true },
      },
      responses: {
        200: {
          description: 'Settings updated',
          content: { 'application/json': { schema: settingsSchema } },
        },
        404: errorResponse('Settings row is missing'),
        422: errorResponse('Validation failed'),
        ...internalErrorResponse,
      },
    }),
    async (c) => c.json(toIsoDates(await updateSettings(c.get('db'), c.req.valid('json'))), 200),
  )
}
