import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NewOrderScreen } from '../src/features/orders/NewOrderScreen'

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}))

// jsdom reports a 0×0 window, which reads as the compact layout. This file
// tests the wide, side-by-side one; the compact bar-and-drawer flow has its
// own file where the tiny window is exactly the case under test.
vi.mock('@repo/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/ui')>()),
  useBreakpoint: () => ({ width: 1440, isCompact: false, isWide: true }),
}))

const menuItem = (
  id: string,
  name: string,
  categoryId: string,
  categoryName: string,
  priceCents: number,
  isAvailable = true,
) => ({
  id,
  categoryId,
  categoryName,
  name,
  description: null,
  priceCents,
  isAvailable,
  isArchived: false,
  imageUrl: null,
  createdAt: '2026-08-01T02:00:00.000Z',
  updatedAt: '2026-08-01T02:00:00.000Z',
})

const items = [
  menuItem('item-1', 'Laksa', 'cat-1', 'Noodles & Rice', 850),
  menuItem('item-2', 'Kaya Toast', 'cat-2', 'Breakfast', 320),
  menuItem('item-3', 'Otah', 'cat-2', 'Breakfast', 600, false),
]

const mutate = vi.fn()

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useGetSettings: () => ({
    data: {
      status: 200,
      data: {
        currency: 'SGD',
        taxRatePercent: 9,
        deliveryFeeCents: 500,
        dineInEnabled: true,
        takeawayEnabled: true,
        deliveryEnabled: false,
      },
    },
  }),
  useListMenuItems: () => ({
    data: { status: 200, data: { data: items, meta: { page: 1, pageSize: 100, total: 3 } } },
    isLoading: false,
    error: null,
  }),
  useListCategories: () => ({
    data: {
      status: 200,
      data: {
        data: [
          { id: 'cat-1', name: 'Noodles & Rice', sortOrder: 0, createdAt: '' },
          { id: 'cat-2', name: 'Breakfast', sortOrder: 1, createdAt: '' },
        ],
      },
    },
  }),
  useListCustomers: () => ({
    data: { status: 200, data: { data: [], meta: { page: 1, pageSize: 100, total: 0 } } },
  }),
  useCreateOrder: () => ({ mutate, isPending: false }),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

describe('NewOrderScreen', () => {
  it('adds a card press straight into the summary — one form drives both panes', () => {
    wrap(<NewOrderScreen />)

    expect(screen.getByText('Items (0)')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Add Laksa'))

    expect(screen.getByText('Items (1)')).toBeTruthy()
    // Two steppers now exist — the card's footer and the summary line — both
    // writing to the same form.
    expect(screen.getAllByLabelText('Add one Laksa')).toHaveLength(2)
  })

  it('narrows the grid by search without touching the order', () => {
    wrap(<NewOrderScreen />)
    fireEvent.click(screen.getByLabelText('Add Laksa'))

    fireEvent.change(screen.getByPlaceholderText('Search menu'), { target: { value: 'kaya' } })

    expect(screen.queryByLabelText('Add Laksa')).toBeNull()
    expect(screen.getByLabelText('Add Kaya Toast')).toBeTruthy()
    // The line survives the grid narrowing.
    expect(screen.getByText('Items (1)')).toBeTruthy()
  })

  it('narrows the grid by category chip', () => {
    wrap(<NewOrderScreen />)

    fireEvent.click(screen.getByText('Noodles & Rice'))

    expect(screen.getByLabelText('Add Laksa')).toBeTruthy()
    expect(screen.queryByLabelText('Add Kaya Toast')).toBeNull()
  })

  it('shows an unavailable dish, inert', () => {
    wrap(<NewOrderScreen />)

    expect(screen.getByText('Otah')).toBeTruthy()
    expect(screen.getByText('Unavailable')).toBeTruthy()
    expect(screen.queryByLabelText('Add Otah')).toBeNull()
  })

  it('offers only the channels Settings has switched on', () => {
    wrap(<NewOrderScreen />)
    // deliveryEnabled: false in the mocked settings.
    expect(screen.queryByText('Delivery')).toBeNull()
  })

  it('submits the form payload through the generated mutation', () => {
    wrap(<NewOrderScreen />)

    fireEvent.click(screen.getByLabelText('Add Laksa'))
    fireEvent.click(screen.getByRole('button', { name: /Place order/ }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: [{ menuItemId: 'item-1', quantity: 1, notes: null }],
        }),
      }),
    )
  })
})
