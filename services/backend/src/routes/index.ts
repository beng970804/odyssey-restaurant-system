import type { App } from '../app'
import { registerHealthRoutes } from './health'

/**
 * One registration point. Both the served Worker (`src/index.ts`) and the
 * OpenAPI generator (`scripts/generate-openapi.ts`) call this, so the API that
 * runs and the document that is committed can never diverge.
 */
export function registerAllRoutes(app: App) {
  registerHealthRoutes(app)
}
