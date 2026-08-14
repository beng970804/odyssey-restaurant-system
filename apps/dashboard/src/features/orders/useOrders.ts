import { getListOrdersQueryKey, unwrap, useGetSettings, useListOrders } from '@repo/api-client'
import { keepPreviousData } from '@tanstack/react-query'
import { useOrderFilters } from './useOrderFilters'

/**
 * Filters, the list query and the settings the rows are rendered against, in
 * the one place that knows they belong together. The screen receives rows and
 * a page count.
 */
export function useOrders() {
  const settings = unwrap(useGetSettings().data)
  // Timezone comes from settings, never the browser: the restaurant's day is
  // not the viewer's — and a date filter is a day, so the filters need it
  // before they can turn one into an instant.
  const timezone = settings?.timezone ?? 'Asia/Singapore'

  const filters = useOrderFilters(timezone)
  // A filter or page change is a new query key. Without a placeholder the list
  // blanks to skeletons on every chip press; with the previous page held it
  // stays put, dimmed by `refreshing`, until the new rows land.
  const { data, isLoading, isFetching, error, refetch } = useListOrders(filters.query, {
    // The key restates what the generated hook would derive — the options type
    // requires it whenever any query option is overridden.
    query: { queryKey: getListOrdersQueryKey(filters.query), placeholderData: keepPreviousData },
  })
  const list = unwrap(data)

  return {
    filters,
    orders: list?.data ?? [],
    meta: list?.meta,
    isLoading,
    refreshing: isFetching && !isLoading,
    error: error as Error | null,
    refetch,
    currency: settings?.currency ?? 'SGD',
    timezone,
  }
}

/** The pending badge is the one piece of data the app shell itself needs. */
export function usePendingOrderCount(): number | undefined {
  const { data } = useListOrders({ status: 'pending', pageSize: 1 })
  return unwrap(data)?.meta.total
}
