import { createApp } from './app'
import { createDb } from './db/client'
import { registerAllRoutes } from './routes'

const app = createApp()

// The only place the real driver is wired. Registered before the routes so
// every handler can read c.get('db').
app.use('*', async (c, next) => {
  c.set('db', createDb(c.env))
  await next()
})

registerAllRoutes(app)

export default app
