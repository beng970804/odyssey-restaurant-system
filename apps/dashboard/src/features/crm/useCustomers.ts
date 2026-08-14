import { getListCustomersQueryKey, unwrap, useListCustomers } from '@repo/api-client'
import { keepPreviousData } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 100

/**
 * The screen owns no query and no debounce timer — it reads `customers` and
 * renders. Spec §10.1: screens compose, they do not compute.
 */
export function useCustomers() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // The typed input updates immediately; the query waits, so a five-letter
  // name is one request rather than five.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Each search term is a new query key; the previous result holds the screen,
  // dimmed by `refreshing`, so typing never blanks the list to skeletons.
  const query = { ...(search && { search }), pageSize: PAGE_SIZE }
  const { data, isLoading, isFetching, error, refetch } = useListCustomers(query, {
    // The key restates what the generated hook would derive — the options type
    // requires it whenever any query option is overridden.
    query: { queryKey: getListCustomersQueryKey(query), placeholderData: keepPreviousData },
  })

  return {
    searchInput,
    setSearchInput,
    searching: Boolean(search),
    customers: unwrap(data)?.data ?? [],
    isLoading,
    refreshing: isFetching && !isLoading,
    error: error as Error | null,
    refetch,
  }
}
