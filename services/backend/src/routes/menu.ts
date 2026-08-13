import { createRoute, z } from '@hono/zod-openapi'
import { and, asc, eq, getTableColumns, ilike, type SQL } from 'drizzle-orm'
import { categories, menuItems } from '../db/schema'
import {
  createMenuItemSchema,
  menuItemListSchema,
  menuItemQuerySchema,
  menuItemWithCategorySchema,
  updateMenuItemSchema,
} from '../schemas/menu'
import { toIsoDates } from '../schemas/common'
import { AppError, errorSchema } from '../lib/errors'
import type { App } from '../app'
import type { Db } from '../db/client'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

const idParamSchema = z.object({ id: z.uuid() })

const withCategory = { ...getTableColumns(menuItems), categoryName: categories.name }

/** Every response shape in this file is a row plus its category name. */
function selectItems(db: Db, where?: SQL) {
  return db
    .select(withCategory)
    .from(menuItems)
    .innerJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(where)
    .orderBy(asc(categories.sortOrder), asc(menuItems.name))
}

async function requireItem(db: Db, id: string) {
  const [row] = await selectItems(db, eq(menuItems.id, id)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', `No menu item with id ${id}`, 404)
  return row
}

export function registerMenuRoutes(app: App) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/menu-items',
      operationId: 'listMenuItems',
      tags: ['Menu'],
      request: { query: menuItemQuerySchema },
      responses: {
        200: {
          description: 'Matching menu items',
          content: { 'application/json': { schema: menuItemListSchema } },
        },
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const { categoryId, available, search, includeArchived } = c.req.valid('query')

      const filters: SQL[] = []
      // Archived items are hidden by default (ADR 0001): they still exist for
      // the order history that references them, but they are not on the menu.
      if (includeArchived !== 'true') filters.push(eq(menuItems.isArchived, false))
      if (categoryId) filters.push(eq(menuItems.categoryId, categoryId))
      if (available) filters.push(eq(menuItems.isAvailable, available === 'true'))
      if (search) filters.push(ilike(menuItems.name, `%${search}%`))

      const rows = await selectItems(db, and(...filters))
      return c.json({ data: rows.map(toIsoDates), meta: { total: rows.length } }, 200)
    },
  )

  app.openapi(
    createRoute({
      method: 'post',
      path: '/menu-items',
      operationId: 'createMenuItem',
      tags: ['Menu'],
      request: {
        body: { content: { 'application/json': { schema: createMenuItemSchema } }, required: true },
      },
      responses: {
        201: {
          description: 'Menu item created',
          content: { 'application/json': { schema: menuItemWithCategorySchema } },
        },
        404: errorResponse('Category not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const body = c.req.valid('json')

      // Checked explicitly so a bad categoryId reads as NOT_FOUND rather than
      // surfacing as a raw foreign-key violation through the 500 handler.
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, body.categoryId))
        .limit(1)
      if (!category) throw new AppError('NOT_FOUND', `No category with id ${body.categoryId}`, 404)

      const [inserted] = await db.insert(menuItems).values(body).returning({ id: menuItems.id })
      return c.json(toIsoDates(await requireItem(db, inserted!.id)), 201)
    },
  )

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/menu-items/{id}',
      operationId: 'updateMenuItem',
      tags: ['Menu'],
      request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: updateMenuItemSchema } }, required: true },
      },
      responses: {
        200: {
          description: 'Menu item updated',
          content: { 'application/json': { schema: menuItemWithCategorySchema } },
        },
        404: errorResponse('Menu item not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')

      if (body.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, body.categoryId))
          .limit(1)
        if (!category) throw new AppError('NOT_FOUND', `No category with id ${body.categoryId}`, 404)
      }

      const [updated] = await db
        .update(menuItems)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(menuItems.id, id))
        .returning({ id: menuItems.id })
      if (!updated) throw new AppError('NOT_FOUND', `No menu item with id ${id}`, 404)

      return c.json(toIsoDates(await requireItem(db, id)), 200)
    },
  )

  app.openapi(
    createRoute({
      method: 'post',
      path: '/menu-items/{id}/archive',
      operationId: 'archiveMenuItem',
      tags: ['Menu'],
      request: { params: idParamSchema },
      responses: {
        200: {
          description: 'Menu item archived',
          content: { 'application/json': { schema: menuItemWithCategorySchema } },
        },
        404: errorResponse('Menu item not found'),
        422: errorResponse('Validation failed'),
      },
    }),
    async (c) => {
      const db = c.get('db')
      const { id } = c.req.valid('param')

      // Archive, never delete: order history snapshots the name and price, but
      // the order_items row still points at this id (ADR 0001).
      const [archived] = await db
        .update(menuItems)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(menuItems.id, id))
        .returning({ id: menuItems.id })
      if (!archived) throw new AppError('NOT_FOUND', `No menu item with id ${id}`, 404)

      return c.json(toIsoDates(await requireItem(db, id)), 200)
    },
  )
}
