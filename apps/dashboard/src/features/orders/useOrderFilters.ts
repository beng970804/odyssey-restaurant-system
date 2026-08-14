import { endOfLocalDay, localDateKey, startOfLocalDay } from '@repo/shared'
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

/** Every filter the URL carries. Named, because clearing one means naming it. */
const PARAM_KEYS = ['status', 'channel', 'from', 'to', 'search', 'page'] as const
type ParamKey = (typeof PARAM_KEYS)[number]

/**
 * Filters live in the URL, so a filtered view is shareable and survives a
 * reload — and so the CRM screen can deep-link into "this customer's orders"
 * without a second order list existing.
 */
export function useOrderFilters(timezone: string) {
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

  /**
   * Every change restates the whole param set, and states a cleared filter as
   * an explicit `undefined`.
   *
   * `router.setParams` *merges* — it hands the object to React Navigation,
   * which spreads it over the params already there. So a key left out is a key
   * left alone, not a key removed: choosing "Any status" and pressing "Clear
   * all" both built an object without `status` in it and changed nothing.
   * Restating every key also means two calls in a row cannot race, which is
   * what dropped `from` when a date range was set as `setFrom` then `setTo`.
   */
  const patch = (changes: Partial<Record<ParamKey, string | undefined>>) => {
    const current: Record<ParamKey, string | undefined> = {
      status,
      channel,
      from,
      to,
      search,
      // Any filter change resets to the first page — page 3 of a new filter is
      // usually empty.
      page: 'page' in changes ? String(page) : undefined,
    }

    const next: Record<string, string | undefined> = {}
    for (const key of PARAM_KEYS) {
      const value = key in changes ? changes[key] : current[key]
      next[key] = value ? String(value) : undefined
    }
    router.setParams(next)
  }

  const setParam = (key: ParamKey, value: string | undefined) => patch({ [key]: value })

  const query = useMemo(
    () => ({
      ...(status && { status }),
      ...(channel && { channel }),
      // A picked day is the restaurant's day, and both ends are inclusive:
      // "14 Aug to 14 Aug" is that whole service, not the empty instant at UTC
      // midnight the two ends used to collapse to.
      ...(from && { from: startOfLocalDay(from, timezone).toISOString() }),
      ...(to && { to: endOfLocalDay(to, timezone).toISOString() }),
      ...(debouncedSearch && { search: debouncedSearch }),
      page,
      pageSize: 25,
    }),
    [status, channel, from, to, debouncedSearch, page, timezone],
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
    /** The date picker's presets hang off the restaurant's today, not the viewer's. */
    today: localDateKey(new Date(), timezone),
    setStatus: (value: OrderStatus | undefined) => setParam('status', value),
    setChannel: (value: OrderChannel | undefined) => setParam('channel', value),
    // Both ends move together: a range is one decision, and one URL update.
    setRange: (nextFrom: string | undefined, nextTo: string | undefined) =>
      patch({ from: nextFrom, to: nextTo }),
    setSearch: setSearchInput,
    setPage: (value: number) => setParam('page', String(value)),
    clearAll: () => {
      setSearchInput('')
      // Every key, explicitly emptied. `setParams({})` merges an empty object
      // over the existing params, which clears nothing.
      patch(Object.fromEntries(PARAM_KEYS.map((key) => [key, undefined])))
    },
  }
}
