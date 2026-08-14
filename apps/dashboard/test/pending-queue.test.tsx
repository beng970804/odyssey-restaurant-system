import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PendingOrdersModal } from '../src/features/home/PendingOrdersModal'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const order = (id: string, orderNumber: number, customerName: string | null) => ({
  id,
  orderNumber,
  customerId: null,
  customerName,
  itemCount: 2,
  channel: 'dine_in',
  status: 'pending',
  subtotalCents: 1000,
  taxCents: 90,
  deliveryFeeCents: 0,
  totalCents: 1090,
  notes: null,
  cancellationReason: null,
  estimatedReadyAt: null,
  placedAt: '2026-08-13T13:31:00.000Z',
  updatedAt: '2026-08-13T13:31:00.000Z',
})

const rows = [order('order-1', 166, 'Marcus Lim'), order('order-2', 167, null)]

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useListOrders: () => ({
    data: { status: 200, data: { data: rows, meta: { page: 1, pageSize: 20, total: 2 } } },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

const modal = () => (
  <PendingOrdersModal open onClose={vi.fn()} currency="SGD" timezone="Asia/Singapore" />
)

describe('PendingOrdersModal', () => {
  it('opens the order in the drawer, with no buttons of its own', () => {
    // The drawer carries the whole order — the receipt, the notes, and the
    // action bar that accepts or cancels it — so the list needs no Accept of
    // its own, and no Decide column to hold one.
    wrap(modal())
    expect(screen.queryByText('Decide')).toBeNull()
    expect(screen.queryByText('Accept')).toBeNull()

    fireEvent.click(screen.getByText('Marcus Lim'))

    expect(screen.getByRole('dialog', { name: 'Order' })).toBeTruthy()
  })

  it('lists what is waiting, and who for', () => {
    wrap(modal())

    expect(screen.getByText('#166')).toBeTruthy()
    expect(screen.getByText('Walk-in')).toBeTruthy()
    // Both rows were placed at the same minute in this fixture.
    expect(screen.getAllByText('13 Aug, 21:31')).toHaveLength(rows.length)
  })
})
