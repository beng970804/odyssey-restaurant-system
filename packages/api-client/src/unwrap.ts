/**
 * Orval types every response as a union discriminated by status, so a query's
 * `data` is `OrderList | Error` until something narrows it. Nothing needs to:
 * `customFetch` throws an `ApiError` on any non-2xx, so by the time React Query
 * hands a screen its data the error branches are unreachable.
 *
 * This is the one place that fact is written down, instead of a cast in every
 * screen — and it is why screens read `unwrap(data)?.data` and never inspect a
 * status code.
 */
type SuccessResponse<R> = R extends { status: 200 | 201 } ? R : never

export function unwrap<R extends { status: number; data: unknown }>(
  response: R | undefined,
): SuccessResponse<R>['data'] | undefined {
  return response?.data as SuccessResponse<R>['data'] | undefined
}
