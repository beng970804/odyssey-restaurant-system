import type { App } from '../app'
import { registerCategoryRoutes } from './categories'
import { registerHealthRoutes } from './health'
import { registerMenuRoutes } from './menu'

/**
 * One registration point. Both the served Worker (`src/index.ts`) and the
 * OpenAPI generator (`scripts/generate-openapi.ts`) call this, so the API that
 * runs and the document that is committed cannot diverge.
 */
export function registerAllRoutes(app: App) {
  registerHealthRoutes(app)
  registerCategoryRoutes(app)
  registerMenuRoutes(app)
}
