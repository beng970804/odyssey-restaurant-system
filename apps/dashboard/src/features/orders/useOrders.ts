import { unwrap, useGetSettings, useListOrders } from '@repo/api-client'
import { useOrderFilters } from './useOrderFilters'

/**
 * Filters, the list query and the settings the rows are rendered against, in
 * the one place that knows they belong together. The screen receives rows and
 * a page count.
 */
export function useOrders() {
  const filters = useOrderFilters()
  const { data, isLoading, error, refetch } = useListOrders(filters.query)
  const settings = unwrap(useGetSettings().data)
  const list = unwrap(data)

  return {
    filters,
    orders: list?.data ?? [],
    meta: list?.meta,
    isLoading,
    error: error as Error | null,
    refetch,
    // Timezone comes from settings, never the browser: the restaurant's day is
    // not the viewer's.
    currency: settings?.currency ?? 'SGD',
    timezone: settings?.timezone ?? 'Asia/Singapore',
  }
}

/** The pending badge is the one piece of data the app shell itself needs. */
export function usePendingOrderCount(): number | undefined {
  const { data } = useListOrders({ status: 'pending', pageSize: 1 })
  return unwrap(data)?.meta.total
}
