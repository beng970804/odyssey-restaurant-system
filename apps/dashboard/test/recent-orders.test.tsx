import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RecentOrdersCard } from '../src/features/home/RecentOrdersCard'

const push = vi.fn()
vi.mock('expo-router', () => ({ useRouter: () => ({ push }) }))

const row = {
  id: 'order-1',
  orderNumber: 168,
  customerId: null,
  customerName: 'Aisyah Rahman',
  itemCount: 2,
  channel: 'delivery',
  status: 'accepted',
  subtotalCents: 7690,
  taxCents: 689,
  deliveryFeeCents: 0,
  totalCents: 8379,
  notes: null,
  cancellationReason: null,
  estimatedReadyAt: null,
  placedAt: '2026-08-13T16:55:00.000Z',
  updatedAt: '2026-08-13T16:55:00.000Z',
}

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  // `unwrap` reads `.data` off the response envelope, so the payload is nested
  // exactly as the generated client returns it.
  useListOrders: () => ({
    data: { status: 200, data: { data: [row], meta: { page: 1, pageSize: 5, total: 1 } } },
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

const card = () => <RecentOrdersCard />

describe('RecentOrdersCard', () => {
  it('is the Orders screen table, not a thinner copy of it', () => {
    // Same component, so the columns cannot drift apart: Channel and Items were
    // the two this card used to leave out.
    wrap(card())

    for (const header of ['Order', 'Placed', 'Customer', 'Channel', 'Items', 'Total', 'Status']) {
      expect(screen.getByText(header)).toBeTruthy()
    }
    expect(screen.getByText('Delivery')).toBeTruthy()
  })

  it('opens the order beside the dashboard rather than navigating to it', () => {
    wrap(card())

    fireEvent.click(screen.getByText('Aisyah Rahman'))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(push).not.toHaveBeenCalled()
  })

  it('still offers the whole list for when five is not enough', () => {
    wrap(card())

    fireEvent.click(screen.getByText('View all'))
    expect(push).toHaveBeenCalledWith('/orders')
  })
})
