import { unwrap, useListCustomers } from '@repo/api-client'
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

  const { data, isLoading, error, refetch } = useListCustomers({
    ...(search && { search }),
    pageSize: PAGE_SIZE,
  })

  return {
    searchInput,
    setSearchInput,
    searching: Boolean(search),
    customers: unwrap(data)?.data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
