import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrderFilters } from '../src/features/orders/useOrderFilters'

/**
 * expo-router's `setParams` merges into the params already in the route, so the
 * mock merges too. A mock that replaced them would have passed while "Any
 * status" and "Clear all" did nothing in the browser.
 */
let params: Record<string, string | undefined> = {}
const setParams = vi.fn((next: Record<string, string | undefined>) => {
  params = { ...params, ...next }
})

vi.mock('expo-router', () => ({
  useRouter: () => ({ setParams }),
  useLocalSearchParams: () => params,
}))

const TIMEZONE = 'Asia/Singapore'
const render = () => renderHook(() => useOrderFilters(TIMEZONE))

beforeEach(() => {
  params = {}
  setParams.mockClear()
})

describe('useOrderFilters', () => {
  it('sets a status', () => {
    const { result } = render()
    act(() => result.current.setStatus('pending'))
    expect(params.status).toBe('pending')
  })

  it('clears a status back to "Any"', () => {
    params = { status: 'pending' }
    const { result } = render()

    act(() => result.current.setStatus(undefined))

    // Not merely absent from the update — absent from the params afterwards.
    expect(params.status).toBeUndefined()
  })

  it('clears a channel without disturbing the status beside it', () => {
    params = { status: 'pending', channel: 'delivery' }
    const { result } = render()

    act(() => result.current.setChannel(undefined))

    expect(params.channel).toBeUndefined()
    expect(params.status).toBe('pending')
  })

  it('sets both ends of a date range in one update', () => {
    const { result } = render()
    act(() => result.current.setRange('2026-08-01', '2026-08-14'))

    expect(setParams).toHaveBeenCalledOnce()
    expect(params.from).toBe('2026-08-01')
    expect(params.to).toBe('2026-08-14')
  })

  it('clears everything', () => {
    params = { status: 'pending', channel: 'delivery', from: '2026-08-01', to: '2026-08-14' }
    const { result } = render()

    act(() => result.current.clearAll())

    expect(params).toEqual({
      status: undefined,
      channel: undefined,
      from: undefined,
      to: undefined,
      search: undefined,
      page: undefined,
    })
  })

  it('drops back to page one when a filter changes', () => {
    params = { page: '3' }
    const { result } = render()

    act(() => result.current.setStatus('ready'))
    expect(params.page).toBeUndefined()
  })

  it('keeps the filters when the page changes', () => {
    params = { status: 'pending' }
    const { result } = render()

    act(() => result.current.setPage(2))
    expect(params).toMatchObject({ page: '2', status: 'pending' })
  })

  it('turns a picked day into the restaurant’s day, both ends inclusive', () => {
    params = { from: '2026-08-14', to: '2026-08-14' }
    const { result } = render()

    // Singapore is UTC+8: the day runs from 16:00 the day before to 15:59:59.999.
    expect(result.current.query.from).toBe('2026-08-13T16:00:00.000Z')
    expect(result.current.query.to).toBe('2026-08-14T15:59:59.999Z')
  })

  it('counts the filters that are actually on', () => {
    params = { status: 'pending', from: '2026-08-01', to: '2026-08-14' }
    expect(render().result.current.activeCount).toBe(3)
  })
})
