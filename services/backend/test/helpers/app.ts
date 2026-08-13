import { createApp } from '../../src/app'
import { registerAllRoutes } from '../../src/routes'
import type { TestDb } from './db'

/**
 * Binds the app to a PGlite database instead of the real driver. Tests call
 * app.request(...) — no network, no server, but the full route stack including
 * validation and the error envelope.
 */
export function createTestApp(db: TestDb) {
  const app = createApp()
  app.use('*', async (c, next) => {
    c.set('db', db as never)
    await next()
  })
  registerAllRoutes(app)
  return app
}
