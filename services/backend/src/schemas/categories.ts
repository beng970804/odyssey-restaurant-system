import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { categories } from '../db/schema'
import { isoDateTime, listMetaSchema } from './common'

/**
 * The drizzle-zod link. `categorySchema` was never hand-written — it is the
 * `categories` table, converted. Add a column to the table and it appears here,
 * in the OpenAPI document, and in the frontend type, without touching this file.
 */
export const categorySchema = createSelectSchema(categories, {
  createdAt: isoDateTime,
}).openapi('Category')

export const createCategorySchema = createInsertSchema(categories, {
  name: (s) => s.min(1, 'Name is required'),
})
  .pick({ name: true, sortOrder: true })
  .openapi('CreateCategory')

export const updateCategorySchema = createCategorySchema.partial().openapi('UpdateCategory')

export const categoryListSchema = z
  .object({ data: z.array(categorySchema), meta: listMetaSchema })
  .openapi('CategoryList')
