import { OpenAPIHono, z } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { AppError } from './lib/errors'

export type Env = { DATABASE_URL: string; DATABASE_DRIVER?: 'neon' | 'postgres' }

export type App = OpenAPIHono<{ Bindings: Env }>

export const OPENAPI_INFO = {
  openapi: '3.1.0',
  info: { title: 'Restaurant Operations API', version: '1.0.0' },
} as const

export function createApp(): App {
  const app = new OpenAPIHono<{ Bindings: Env }>({
    // Makes *every* route's validation failure return the same envelope
    // automatically, rather than each route remembering to handle it.
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Request validation failed',
              // zod 4: flattenError() replaces .flatten()
              details: z.flattenError(result.error),
            },
          },
          422,
        )
      }
    },
  })

  app.use('*', cors())

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status,
      )
    }
    console.error(err)
    return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500)
  })

  app.doc('/doc', OPENAPI_INFO)
  app.get('/reference', apiReference({ url: '/doc' }))

  return app
}
