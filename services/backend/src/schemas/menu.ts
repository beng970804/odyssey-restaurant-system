import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { menuItems } from '../db/schema'
import { catalogQuerySchema, isoDateTime, listMetaSchema } from './common'

export const menuItemSchema = createSelectSchema(menuItems, {
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
}).openapi('MenuItem')

/**
 * What a list row actually carries. The category name is joined rather than
 * stored, so the frontend never has to hold a second query to render a table.
 */
export const menuItemWithCategorySchema = menuItemSchema
  .extend({ categoryName: z.string() })
  .openapi('MenuItemWithCategory')

/**
 * The base types come from the table; the business rules are layered on.
 * That is the pattern for every resource in this codebase.
 */
export const createMenuItemSchema = createInsertSchema(menuItems, {
  name: (s) => s.min(1, 'Name is required'),
  priceCents: (s) => s.nonnegative('Price cannot be negative'),
})
  .pick({
    categoryId: true,
    name: true,
    description: true,
    priceCents: true,
    isAvailable: true,
    imageUrl: true,
  })
  .openapi('CreateMenuItem')

export const updateMenuItemSchema = createMenuItemSchema.partial().openapi('UpdateMenuItem')

/**
 * Query parameters arrive as strings, so booleans are spelled out rather than
 * coerced — an explicit enum keeps the OpenAPI document honest about what the
 * wire actually carries.
 */
export const menuItemQuerySchema = z
  .object({
    categoryId: z.uuid().optional(),
    available: z.enum(['true', 'false']).optional(),
    search: z.string().min(1).optional(),
    includeArchived: z.enum(['true', 'false']).optional(),
  })
  .extend(catalogQuerySchema.shape)

export const menuItemListSchema = z
  .object({ data: z.array(menuItemWithCategorySchema), meta: listMetaSchema })
  .openapi('MenuItemList')
