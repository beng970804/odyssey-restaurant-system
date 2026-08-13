import { createRoute } from '@hono/zod-openapi'
import { asc, eq } from 'drizzle-orm'
import { categories } from '../db/schema'
import {
  categoryIdParamSchema,
  categoryListSchema,
  categorySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/categories'
import { toIsoDates } from '../schemas/common'
import { AppError, errorSchema } from '../lib/errors'
import type { App } from '../app'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

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
        500: errorResponse('Error'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
      // Explicit 200: the route declares a 500 response too, so without a
      // status c.json() infers `200 | 500` and checks this body against the
      // error envelope as well.
      return c.json({ data: rows.map(toIsoDates), meta: { total: rows.length } }, 200)
    },
  )

  app.openapi(
    createRoute({
      method: 'post',
      path: '/categories',
      operationId: 'createCategory',
      tags: ['Menu'],
      request: {
        body: { content: { 'application/json': { schema: createCategorySchema } }, required: true },
      },
      responses: {
        201: {
          description: 'Category created',
          content: { 'application/json': { schema: categorySchema } },
        },
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const [row] = await db.insert(categories).values(c.req.valid('json')).returning()
      return c.json(toIsoDates(row!), 201)
    },
  )

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/categories/{id}',
      operationId: 'updateCategory',
      tags: ['Menu'],
      request: {
        params: categoryIdParamSchema,
        body: { content: { 'application/json': { schema: updateCategorySchema } }, required: true },
      },
      responses: {
        200: {
          description: 'Category updated',
          content: { 'application/json': { schema: categorySchema } },
        },
        404: errorResponse('Category not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')
      const [row] = await db
        .update(categories)
        .set(c.req.valid('json'))
        .where(eq(categories.id, id))
        .returning()
      if (!row) throw new AppError('NOT_FOUND', `No category with id ${id}`, 404)
      return c.json(toIsoDates(row), 200)
    },
  )
}
