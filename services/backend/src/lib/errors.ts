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

export type ErrorCode =
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
