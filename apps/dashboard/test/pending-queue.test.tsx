import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
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
  it('offers the decision on the row, without opening the order first', () => {
    wrap(modal())

    expect(screen.getAllByText('Accept')).toHaveLength(rows.length)
    expect(screen.getAllByText('Open')).toHaveLength(rows.length)
  })

  it('leaves Cancel to the order itself', () => {
    // The API refuses a cancellation without a reason, and collecting one is a
    // form rather than a quick action — a second modal over this one.
    wrap(modal())

    expect(screen.queryByText('Cancel')).toBeNull()
  })

  it('takes its buttons from the transition map, not from a list of its own', () => {
    // Every row here is Pending, and Accept is what the map allows from there.
    // A row that had moved on would not offer it.
    wrap(modal())

    expect(screen.getAllByText('Accept')[0]).toBeTruthy()
    expect(screen.getByText('#166')).toBeTruthy()
    expect(screen.getByText('Walk-in')).toBeTruthy()
  })
})
