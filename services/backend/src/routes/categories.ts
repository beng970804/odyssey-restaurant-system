import { createRoute } from '@hono/zod-openapi'
import { asc } from 'drizzle-orm'
import { categories } from '../db/schema'
import { createDb } from '../db/client'
import { categoryListSchema } from '../schemas/categories'
import { toIsoDates } from '../schemas/common'
import { errorSchema } from '../lib/errors'
import type { App } from '../app'

export function registerCategoryRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/categories',
      operationId: 'listCategories',
      tags: ['Menu'],
      responses: {
        200: {
          description: 'All categories',
          content: { 'application/json': { schema: categoryListSchema } },
        },
        500: {
          description: 'Error',
          content: { 'application/json': { schema: errorSchema } },
        },
      },
    }),
    async (c) => {
      const db = createDb(c.env)
      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
      // Explicit 200: the route declares a 500 response too, so without a
      // status c.json() infers `200 | 500` and checks this body against the
      // error envelope as well.
      return c.json({ data: rows.map(toIsoDates), meta: { total: rows.length } }, 200)
    },
  )
}
