import { z } from '@hono/zod-openapi'

/**
 * Drizzle returns Date objects; c.json() serialises them to ISO strings.
 * Derived select schemas must swap every timestamp column to this, or the
 * OpenAPI document gets an unrepresentable z.date() and the generated frontend
 * types are wrong. Forgetting one is loud, not silent: the generator throws.
 */
export const isoDateTime = z.iso.datetime()

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
