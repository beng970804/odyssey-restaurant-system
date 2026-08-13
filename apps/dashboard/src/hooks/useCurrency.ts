import { unwrap, useGetSettings } from '@repo/api-client'

/** Currency lives in settings, so no screen hardcodes 'SGD'. */
export function useCurrency(): string {
  const { data } = useGetSettings()
  return unwrap(data)?.currency ?? 'SGD'
}
