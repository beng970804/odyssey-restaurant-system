import { unwrap, useGetSettings } from '@repo/api-client'

/**
 * The restaurant's timezone, so no screen compares against the server clock —
 * a Worker runs in UTC and the restaurant does not.
 */
export function useTimezone(): string {
  const { data } = useGetSettings()
  return unwrap(data)?.timezone ?? 'Asia/Singapore'
}
