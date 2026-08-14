import {
  ApiProvider,
  createQueryClient,
  getGetOrderQueryKey,
  getListOrdersQueryKey,
  type OrderRow,
} from '@repo/api-client'
import { ORDER_STATUSES, type OrderStatus } from '@repo/types'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrderActionBar } from '../src/features/orders/OrderActionBar'

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

const order = (status: OrderStatus) => ({ id: 'order-1', orderNumber: 42, status })

describe('OrderActionBar', () => {
  it('offers accept and cancel on a pending order', () => {
    wrap(<OrderActionBar order={order('pending')} />)

    expect(screen.getByText('Accept')).toBeTruthy()
    expect(screen.getByText('Cancel')).toBeTruthy()
    expect(screen.queryByText('Complete')).toBeNull()
  })

  it('renders only the actions the transition map allows', () => {
    wrap(<OrderActionBar order={order('ready')} />)

    expect(screen.getByText('Complete')).toBeTruthy()
    // A ready order cannot be cancelled — the food is made.
    expect(screen.queryByText('Cancel')).toBeNull()
    expect(screen.queryByText('Accept')).toBeNull()
  })

  it('renders no actions for a terminal order', () => {
    wrap(<OrderActionBar order={order('completed')} />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/nothing left to do/i)).toBeTruthy()
  })

  it.each(ORDER_STATUSES)('never offers an action the server would refuse from %s', (status) => {
    wrap(<OrderActionBar order={order(status)} />)

    // Buttons and the shared map are the same source, checked here per status
    // so a change to ORDER_TRANSITIONS is caught by the UI suite too.
    const labels = ['Accept', 'Start preparing', 'Mark ready', 'Complete', 'Cancel']
    const rendered = labels.filter((label) => screen.queryByText(label) !== null)

    const expected = {
      pending: ['Accept', 'Cancel'],
      accepted: ['Start preparing', 'Cancel'],
      preparing: ['Mark ready', 'Cancel'],
      ready: ['Complete'],
      completed: [],
      cancelled: [],
    }[status]

    expect(rendered.toSorted()).toEqual(expected.toSorted())
  })
})

/** A full list row, so the cache looks exactly like a fetched page. */
const row = (status: OrderStatus): OrderRow => ({
  id: 'order-1',
  orderNumber: 42,
  customerId: null,
  customerName: 'Walk-in',
  itemCount: 2,
  channel: 'dine_in',
  status,
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

const LIST_KEY = getListOrdersQueryKey({ status: 'pending', pageSize: 20 })
const DETAIL_KEY = getGetOrderQueryKey('order-1')

const seededClient = () => {
  const client = createQueryClient()
  client.setQueryData(LIST_KEY, {
    status: 200,
    data: { data: [row('pending')], meta: { page: 1, pageSize: 20, total: 1 } },
  })
  client.setQueryData(DETAIL_KEY, { status: 200, data: { ...row('pending'), items: [] } })
  return client
}

const listStatus = (client: ReturnType<typeof createQueryClient>) =>
  (client.getQueryData(LIST_KEY) as { data: { data: OrderRow[] } }).data.data[0]?.status

const detailStatus = (client: ReturnType<typeof createQueryClient>) =>
  (client.getQueryData(DETAIL_KEY) as { data: OrderRow }).data.status

afterEach(() => vi.unstubAllGlobals())

describe('optimistic order actions', () => {
  it('moves the order in every cache before the server answers', async () => {
    // The pass acts on an order and looks straight back at the board. Waiting
    // for the round trip leaves a button that looks ignored for as long as the
    // network takes — the cache moves first, and the server confirms.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    const client = seededClient()
    render(
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <ToastProvider>
            <OrderActionBar order={order('pending')} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByText('Accept'))

    await waitFor(() => expect(listStatus(client)).toBe('accepted'))
    expect(detailStatus(client)).toBe('accepted')
  })

  it('puts every cache back when the server refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    )
    const client = seededClient()
    render(
      <ThemeProvider>
        <QueryClientProvider client={client}>
          <ToastProvider>
            <OrderActionBar order={order('pending')} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByText('Accept'))

    // The failure undoes the optimistic write everywhere, and says so.
    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeTruthy())
    expect(listStatus(client)).toBe('pending')
    expect(detailStatus(client)).toBe('pending')
  })
})
