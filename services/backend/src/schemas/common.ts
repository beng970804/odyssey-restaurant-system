import { z } from '@hono/zod-openapi'

/**
 * Drizzle returns Date objects; c.json() serialises them to ISO strings.
 * Derived select schemas must swap every timestamp column to this, or the
 * OpenAPI document gets an unrepresentable z.date() and the generated frontend
 * types are wrong. Forgetting one is loud, not silent: the generator throws.
 */
export const isoDateTime = z.iso.datetime()

/** Every resource is keyed by a uuid, so every `{id}` route validates the same way. */
export const uuidParamSchema = z.object({ id: z.uuid() })

/**
 * Catalogues (categories, menu items, customers) are small and the screens want
 * them whole, so the default page is the cap. The cap is the point: an uncapped
 * page size is an easy way for a client to ask for the entire table. Orders
 * paginate properly — they grow without bound — and declare their own default.
 */
export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
})

/** Spec §8: lists are `{ data, meta: { total, page, pageSize } }`, uniformly. */
export const listMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
})

export type PageQuery = { page: number; pageSize: number }

/** Applies a page to an already-filtered row set and reports it honestly. */
export function paginate<T>(rows: T[], { page, pageSize }: PageQuery) {
  const start = (page - 1) * pageSize
  return {
    data: rows.slice(start, start + pageSize),
    meta: { total: rows.length, page, pageSize },
  }
}

type IsoDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K]
}

/**
 * The runtime half of `isoDateTime`. The override above fixes the *document* —
 * it says a timestamp column is a date-time string — but Drizzle still hands
 * the handler a Date. `c.json()` would serialise it correctly anyway, so the
 * mismatch is invisible at runtime and caught only by the typed response.
 * Converting here makes the Date-to-string boundary explicit in one place
 * instead of a cast at every route.
 */
export function toIsoDates<T extends Record<string, unknown>>(row: T): IsoDates<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value
  }
  return out as IsoDates<T>
}
