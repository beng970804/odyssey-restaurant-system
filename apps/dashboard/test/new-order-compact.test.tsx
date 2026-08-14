import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NewOrderScreen } from '../src/features/orders/NewOrderScreen'

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}))

// No breakpoint mock: jsdom's 0×0 window *is* the compact layout.

const items = [
  {
    id: 'item-1',
    categoryId: 'cat-1',
    categoryName: 'Noodles & Rice',
    name: 'Laksa',
    description: null,
    priceCents: 850,
    isAvailable: true,
    isArchived: false,
    imageUrl: null,
    createdAt: '2026-08-01T02:00:00.000Z',
    updatedAt: '2026-08-01T02:00:00.000Z',
  },
]

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useGetSettings: () => ({
    data: {
      status: 200,
      data: {
        currency: 'SGD',
        taxRatePercent: 9,
        deliveryFeeCents: 0,
        dineInEnabled: true,
        takeawayEnabled: true,
        deliveryEnabled: true,
        timezone: 'Asia/Singapore',
        openingHours: Object.fromEntries(
          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => [
            day,
            { open: '00:00', close: '23:59' },
          ]),
        ),
      },
    },
  }),
  useListMenuItems: () => ({
    data: { status: 200, data: { data: items, meta: { page: 1, pageSize: 100, total: 1 } } },
    isLoading: false,
    error: null,
  }),
  useListCategories: () => ({ data: { status: 200, data: { data: [] } } }),
  useListCustomers: () => ({
    data: { status: 200, data: { data: [], meta: { page: 1, pageSize: 100, total: 0 } } },
  }),
  useCreateOrder: () => ({ mutate: vi.fn(), isPending: false }),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

describe('NewOrderScreen, compact', () => {
  it('pairs the menu tiles two to a row rather than one giant card each', () => {
    // A tile is a photo band, a name and a price — half a phone carries it
    // comfortably, and one per row made picking three dishes three screens of
    // scrolling.
    wrap(<NewOrderScreen />)

    const cell = screen.getByLabelText('Add Laksa').parentElement?.parentElement
    expect(cell?.style.flex).toBe('1 1 50%')
  })

  it('restates the order in the bottom bar, so the total needs no drawer', async () => {
    wrap(<NewOrderScreen />)

    expect(screen.getByText(/0 items ·/)).toBeTruthy()
    expect(screen.getByLabelText('S$0.00')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Add Laksa'))

    // The settled figure is the accessible one from the first frame — a value
    // ticking up would have a screen reader announce every step of it.
    expect(screen.getByText(/1 item ·/)).toBeTruthy()
    expect(screen.getByLabelText('S$9.27')).toBeTruthy()

    // The visible figure ticks toward 850 + 9% tax (77) rather than jumping.
    await waitFor(() => expect(screen.getByText('S$9.27')).toBeTruthy())
  })

  it('opens the same summary panel in a drawer to review and place', () => {
    wrap(<NewOrderScreen />)
    fireEvent.click(screen.getByLabelText('Add Laksa'))

    expect(screen.queryByText('Items (1)')).toBeNull()
    fireEvent.click(screen.getByText('Review order'))

    expect(screen.getByText('Items (1)')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Place order/ })).toBeTruthy()
  })

  it('keeps Review disabled while the order is empty', () => {
    wrap(<NewOrderScreen />)
    expect(screen.getByRole('button', { name: 'Review order' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
