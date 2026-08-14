import { createQueryClient } from '@repo/api-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCustomers } from '../src/features/crm/useCustomers'
import { useMenuItems } from '../src/features/menu/useMenuItems'
import { useOrders } from '../src/features/orders/useOrders'

/** The merging mock from useOrderFilters.test — setParams merges, so this must. */
let params: Record<string, string | undefined> = {}
const setParams = vi.fn((next: Record<string, string | undefined>) => {
  params = { ...params, ...next }
})

vi.mock('expo-router', () => ({
  useRouter: () => ({ setParams }),
  useLocalSearchParams: () => params,
}))

const settings = {
  timezone: 'Asia/Singapore',
  currency: 'SGD',
}

const orderRow = (orderNumber: number) => ({
  id: `order-${String(orderNumber)}`,
  orderNumber,
  customerId: null,
  customerName: 'Walk-in',
  itemCount: 1,
  channel: 'dine_in',
  status: 'pending',
  subtotalCents: 1000,
  taxCents: 90,
  deliveryFeeCents: 0,
  totalCents: 1090,
  notes: null,
  cancellationReason: null,
  estimatedReadyAt: null,
  placedAt: '2026-08-14T02:00:00.000Z',
  updatedAt: '2026-08-14T02:00:00.000Z',
})

const customerRow = (name: string) => ({
  id: `customer-${name}`,
  name,
  phone: null,
  email: null,
  notes: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  orderCount: 1,
  lifetimeSpendCents: 1000,
})

const menuRow = (name: string, categoryId: string) => ({
  id: `item-${name}`,
  name,
  categoryId,
  categoryName: 'Mains',
  priceCents: 1000,
  description: null,
  imageUrl: null,
  isAvailable: true,
  archivedAt: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  updatedAt: '2026-08-01T02:00:00.000Z',
})

const page = (rows: unknown[], total = rows.length) => ({
  data: rows,
  meta: { page: 1, pageSize: 25, total },
})

const ok = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
  headers: new Headers(),
})

/**
 * Routes each request by path and query. A handler returning `null` leaves the
 * request hanging, which is what "the next page is still loading" is.
 */
const stubFetch = (route: (url: URL) => unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const url = new URL(input)
      if (url.pathname === '/settings') return Promise.resolve(ok(settings))
      const body = route(url)
      if (body === null) return new Promise<never>(() => {})
      return Promise.resolve(ok(body))
    }),
  )

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
)

beforeEach(() => {
  params = {}
  setParams.mockClear()
})

afterEach(() => vi.unstubAllGlobals())

describe('useOrders across a page change', () => {
  it('keeps the previous page on screen and reports refreshing', async () => {
    stubFetch((url) => {
      if (url.pathname !== '/orders') return page([])
      // Page 2 never lands: the moment under test is mid-refetch.
      return url.searchParams.get('page') === '2' ? null : page([orderRow(42)], 60)
    })

    const { result, rerender } = renderHook(() => useOrders(), { wrapper })
    await waitFor(() => expect(result.current.orders).toHaveLength(1))

    act(() => result.current.filters.setPage(2))
    rerender()

    // The old rows hold the screen; the skeleton branch must not run.
    await waitFor(() => expect(result.current.refreshing).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.orders[0]?.orderNumber).toBe(42)
  })
})

describe('useCustomers across a search change', () => {
  it('keeps the previous rows on screen and reports refreshing', async () => {
    stubFetch((url) => {
      if (url.pathname !== '/customers') return page([])
      return url.searchParams.get('search') ? null : page([customerRow('Aisha')])
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })
    await waitFor(() => expect(result.current.customers).toHaveLength(1))

    act(() => result.current.setSearchInput('Chen'))
    // Past the debounce, into the hanging search request.
    await waitFor(() => expect(result.current.refreshing).toBe(true), { timeout: 2000 })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.customers[0]?.name).toBe('Aisha')
  })
})

describe('useMenuItems across a category change', () => {
  it('keeps the previous rows on screen and reports refreshing', async () => {
    stubFetch((url) => {
      if (url.pathname === '/categories') return page([{ id: 'cat-1', name: 'Mains' }])
      if (url.pathname !== '/menu-items') return page([])
      return url.searchParams.get('categoryId') ? null : page([menuRow('Laksa', 'cat-1')])
    })

    const { result } = renderHook(() => useMenuItems(), { wrapper })
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    act(() => result.current.setCategory('cat-1'))

    await waitFor(() => expect(result.current.refreshing).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.items[0]?.name).toBe('Laksa')
  })
})
