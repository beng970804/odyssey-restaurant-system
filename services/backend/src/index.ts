import { createApp } from './app'
import { registerAllRoutes } from './routes'

const app = createApp()
registerAllRoutes(app)

export default app
