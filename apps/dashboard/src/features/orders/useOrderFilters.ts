import { ORDER_CHANNELS, ORDER_STATUSES, type OrderChannel, type OrderStatus } from '@repo/types'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'

export type OrderFilters = {
  status?: OrderStatus
  channel?: OrderChannel
  from?: string
  to?: string
  search?: string
  page: number
}

const SEARCH_DEBOUNCE_MS = 300

const asOne = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/**
 * Filters live in the URL, so a filtered view is shareable and survives a
 * reload — and so the CRM screen can deep-link into "this customer's orders"
 * without a second order list existing.
 */
export function useOrderFilters() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const status = ORDER_STATUSES.find((s) => s === asOne(params.status))
  const channel = ORDER_CHANNELS.find((c) => c === asOne(params.channel))
  const search = asOne(params.search) ?? ''
  const from = asOne(params.from)
  const to = asOne(params.to)
  const page = Number(asOne(params.page) ?? 1)

  // The typed input updates immediately; the query waits, so a five-letter
  // customer name is one request rather than five.
  const [searchInput, setSearchInput] = useState(search)
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const setParam = (key: string, value: string | undefined) => {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries({
      status,
      channel,
      from,
      to,
      search,
      page: String(page),
    })) {
      if (v) next[k] = String(v)
    }
    if (value) next[key] = value
    else delete next[key]
    // Any filter change resets to the first page — page 3 of a new filter is
    // usually empty.
    if (key !== 'page') delete next.page
    router.setParams(next)
  }

  const query = useMemo(
    () => ({
      ...(status && { status }),
      ...(channel && { channel }),
      ...(from && { from: new Date(from).toISOString() }),
      ...(to && { to: new Date(to).toISOString() }),
      ...(debouncedSearch && { search: debouncedSearch }),
      page,
      pageSize: 25,
    }),
    [status, channel, from, to, debouncedSearch, page],
  )

  const activeCount = [status, channel, from, to, debouncedSearch].filter(Boolean).length

  return {
    status,
    channel,
    from,
    to,
    page,
    searchInput,
    activeCount,
    query,
    setStatus: (value: OrderStatus | undefined) => setParam('status', value),
    setChannel: (value: OrderChannel | undefined) => setParam('channel', value),
    setFrom: (value: string | undefined) => setParam('from', value),
    setTo: (value: string | undefined) => setParam('to', value),
    setSearch: setSearchInput,
    setPage: (value: number) => setParam('page', String(value)),
    clearAll: () => {
      setSearchInput('')
      router.setParams({})
    },
  }
}
