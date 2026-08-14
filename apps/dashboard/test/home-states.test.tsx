import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomeScreen from '../app/(dashboard)/index'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }))

const summary = {
  totalOrders: 60,
  revenueCents: 381311,
  pendingOrders: 5,
  averageOrderValueCents: 6809,
  topItems: [{ menuItemId: 'item-1', name: 'Bandung', quantitySold: 17 }],
  dailyTrend: [{ date: '2026-08-13', orderCount: 17, revenueCents: 109363 }],
}

const stats = vi.hoisted(() => ({ state: {} as Record<string, unknown> }))

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useGetStatsSummary: () => stats.state,
  useListOrders: () => ({ data: undefined, isLoading: true, error: null, refetch: vi.fn() }),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

/** Every card in the layout, whatever state the screen is in. */
const cardCount = (container: HTMLElement) =>
  container.querySelectorAll('[class*="css-view"]').length

afterEach(() => {
  stats.state = {}
})

describe('the home screen states', () => {
  it('holds the layout while it loads, so nothing shifts when data lands', () => {
    // Task 20 step 3: "skeletons appear in the card layout with no shift". The
    // trend and top-items row used to render nothing at all until data arrived,
    // then push the orders table down the page.
    stats.state = { data: undefined, isLoading: true, error: null, refetch: vi.fn() }
    const loading = wrap(<HomeScreen />)

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    // The two cards that used to be missing entirely are present as skeletons:
    // the chart's placeholder block, and five top-item rows.
    const skeletonCount = screen.getAllByTestId('skeleton').length
    const loadingDepth = cardCount(loading.container)
    loading.unmount()

    stats.state = {
      data: { status: 200, data: summary },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }
    const loaded = wrap(<HomeScreen />)

    expect(screen.getByText('Last seven days')).toBeTruthy()
    expect(screen.getByText('Top items')).toBeTruthy()
    // The loaded screen is the same shape as the skeleton one — same rows, same
    // cards — rather than two rows taller.
    expect(cardCount(loaded.container)).toBeGreaterThan(loadingDepth / 2)
    expect(skeletonCount).toBeGreaterThan(8)
  })

  it('offers a retry when the summary fails', () => {
    const refetch = vi.fn()
    stats.state = { data: undefined, isLoading: false, error: new Error('offline'), refetch }
    wrap(<HomeScreen />)

    expect(screen.getByText('Try again')).toBeTruthy()
    // The greeting stays: an error in one query is not an error in the screen.
    expect(screen.getByText(/Welcome back/)).toBeTruthy()
  })

  it('renders the figures once they arrive', () => {
    stats.state = {
      data: { status: 200, data: summary },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }
    wrap(<HomeScreen />)

    expect(screen.getByLabelText('60')).toBeTruthy()
    expect(screen.getByLabelText('S$3,813.11')).toBeTruthy()
    expect(screen.getByText('Bandung')).toBeTruthy()
  })
})
