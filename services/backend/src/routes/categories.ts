import { createRoute } from '@hono/zod-openapi'
import { asc, eq } from 'drizzle-orm'
import { categories } from '../db/schema'
import {
  categoryListSchema,
  categorySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/categories'
import { catalogQuerySchema, paginate, toIsoDates, uuidParamSchema } from '../schemas/common'
import { AppError, errorResponse, internalErrorResponse } from '../lib/errors'
import type { App } from '../app'

export function registerCategoryRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/categories',
      operationId: 'listCategories',
      tags: ['Menu'],
      request: { query: catalogQuerySchema },
      responses: {
        200: {
          description: 'All categories',
          content: { 'application/json': { schema: categoryListSchema } },
        },
        422: errorResponse('Validation failed'),
        ...internalErrorResponse,
      },
    }),
    async (c) => {
      const db = c.get('db')
      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
      // Explicit 200: the route declares error responses too, so without a
      // status c.json() checks this body against the error envelope as well.
      return c.json(paginate(rows.map(toIsoDates), c.req.valid('query')), 200)
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
        ...internalErrorResponse,
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
        params: uuidParamSchema,
        body: { content: { 'application/json': { schema: updateCategorySchema } }, required: true },
      },
      responses: {
        200: {
          description: 'Category updated',
          content: { 'application/json': { schema: categorySchema } },
        },
        404: errorResponse('Category not found'),
        422: errorResponse('Validation failed'),
        ...internalErrorResponse,
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
