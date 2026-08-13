import { z } from '@hono/zod-openapi'

export const errorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'ITEM_UNAVAILABLE' }),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .openapi('Error')

/**
 * The one place a route describes an error response. Spec §8 asks for a shared
 * response so every endpoint documents the envelope identically; a per-file
 * copy of this helper drifts the moment someone edits one of them.
 */
export const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
})

/** Every route can fail this way, so every route documents it. */
export const internalErrorResponse = {
  500: errorResponse('Internal server error'),
}

export type ErrorCode =
  // Emitted by the onError catch-all rather than thrown as an AppError — it is
  // the one failure that is not a domain failure.
  | 'INTERNAL'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'ITEM_UNAVAILABLE'
  | 'CHANNEL_DISABLED'
  | 'OUTSIDE_OPENING_HOURS'
  | 'INVALID_TRANSITION'

/**
 * Every failure in this codebase throws an AppError; a single Hono `onError`
 * handler converts it to the envelope. That is why no route ever hand-builds
 * an error response.
 */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: 400 | 404 | 409 | 422,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
