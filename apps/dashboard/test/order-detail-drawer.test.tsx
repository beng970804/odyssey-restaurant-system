import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OrderDetailDrawer } from '../src/features/orders/OrderDetailDrawer'

const detail = {
  id: 'order-1',
  orderNumber: 166,
  customerId: null,
  customer: null,
  channel: 'takeaway',
  status: 'accepted',
  items: [
    {
      id: 'line-1',
      menuItemId: 'item-1',
      nameSnapshot: 'Laksa',
      unitPriceCents: 850,
      quantity: 1,
      notes: null,
    },
  ],
  subtotalCents: 850,
  taxCents: 77,
  deliveryFeeCents: 0,
  totalCents: 927,
  notes: null,
  cancellationReason: null,
  estimatedReadyAt: '2026-08-13T13:56:00.000Z' as string | null,
  placedAt: '2026-08-13T13:31:00.000Z',
  updatedAt: '2026-08-13T13:31:00.000Z',
}

let orderData: typeof detail = detail

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useGetOrder: () => ({
    data: { status: 200, data: orderData },
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

const drawer = () => (
  <OrderDetailDrawer orderId="order-1" onClose={vi.fn()} currency="SGD" timezone="Asia/Singapore" />
)

describe('OrderDetailDrawer', () => {
  it('shows when the order should be ready, on the restaurant clock', () => {
    orderData = detail
    wrap(drawer())

    expect(screen.getByText('Estimated ready')).toBeTruthy()
    // 13:56 UTC is 21:56 in Singapore — the settings timezone, not the browser's.
    expect(screen.getByText('13 Aug, 21:56')).toBeTruthy()
  })

  it('omits the estimate when the order has none', () => {
    orderData = { ...detail, estimatedReadyAt: null }
    wrap(drawer())

    expect(screen.queryByText('Estimated ready')).toBeNull()
  })
})
