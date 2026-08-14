import type { OrderRow } from '@repo/api-client'
import { ThemeProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrdersTable } from '../src/features/orders/OrdersTable'

// jsdom's 0×0 window reads as compact, where OrdersTable renders the list
// instead of the sortable table. The width is faked so both can be pinned.
let viewportWidth = 1440

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    useWindowDimensions: () => ({ width: viewportWidth, height: 900, scale: 1, fontScale: 1 }),
  }
})

beforeEach(() => {
  viewportWidth = 1440
})

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const order = (overrides: Partial<OrderRow> = {}): OrderRow => ({
  id: 'order-1',
  orderNumber: 1,
  status: 'pending',
  channel: 'dine_in',
  customerId: null,
  customerName: 'Aisha Rahman',
  subtotalCents: 1000,
  taxCents: 90,
  deliveryFeeCents: 0,
  totalCents: 1090,
  itemCount: 2,
  notes: null,
  cancellationReason: null,
  estimatedReadyAt: null,
  placedAt: '2026-08-14T02:00:00.000Z',
  updatedAt: '2026-08-14T02:00:00.000Z',
  ...overrides,
})

const rows: OrderRow[] = [
  order({ id: 'a', orderNumber: 17, totalCents: 3000, status: 'completed', customerName: 'Bala' }),
  order({
    id: 'b',
    orderNumber: 178,
    totalCents: 12_000,
    status: 'pending',
    customerName: 'Aisha',
  }),
  order({ id: 'c', orderNumber: 3, totalCents: 500, status: 'ready', customerName: 'Chandra' }),
]

const table = () =>
  wrap(
    <OrdersTable
      rows={rows}
      loading={false}
      error={null}
      onRetry={() => {}}
      onRowPress={() => {}}
      currency="SGD"
      timezone="Asia/Singapore"
      filtered={false}
    />,
  )

/** The order rows are read back by the one cell that is unique per row. */
const orderNumbers = () =>
  screen
    .getAllByText(/^#\d+$/)
    .map((node) => node.textContent)
    .filter((text): text is string => text !== null)

const sortBy = (column: string) => fireEvent.click(screen.getByLabelText(`Sort by ${column}`))

describe('OrdersTable sorting', () => {
  it('sorts by total on the underlying cents, not the rendered money', () => {
    table()
    sortBy('Total')

    // S$120.00 above S$30.00 above S$5.00 — string order would invert the first two.
    expect(orderNumbers()).toEqual(['#178', '#17', '#3'])
  })

  it('sorts by order number numerically, so #178 is not below #3', () => {
    table()
    sortBy('Order')
    expect(orderNumbers()).toEqual(['#178', '#17', '#3'])
  })

  it('reverses on a second press', () => {
    table()
    sortBy('Order')
    sortBy('Order')
    expect(orderNumbers()).toEqual(['#3', '#17', '#178'])
  })

  it('sorts by customer alphabetically, A first', () => {
    table()
    sortBy('Customer')
    expect(orderNumbers()).toEqual(['#178', '#17', '#3'])
  })

  it('sorts status through the order lifecycle rather than the alphabet', () => {
    table()
    sortBy('Status')

    // pending, ready, completed — not completed, pending, ready.
    expect(orderNumbers()).toEqual(['#178', '#3', '#17'])
  })

  it('leaves channel unsorted: that is what the channel filter is for', () => {
    table()
    expect(screen.queryByLabelText('Sort by Channel')).toBeNull()
  })

  it('trades the table for the list on a phone, status still in view', () => {
    // Seven columns on a 390px screen leave Total and Status behind a sideways
    // scroll. The compact form is decided here, in the one component every
    // orders list renders, so no screen writes the swap itself.
    viewportWidth = 390
    table()

    expect(screen.queryByRole('columnheader')).toBeNull()
    expect(screen.getByText('#17 · Bala')).toBeTruthy()
    expect(screen.getByText('Completed')).toBeTruthy()
  })
})
