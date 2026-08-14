import type { OrderRow } from '@repo/api-client'
import { ThemeProvider, lightTheme } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrderListCompact } from '../src/features/orders/OrderListCompact'

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

const order = (over: Partial<OrderRow>): OrderRow => ({
  id: 'order-1',
  orderNumber: 166,
  customerId: null,
  customerName: 'Marcus Lim',
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
  ...over,
})

const list = (props: Partial<Parameters<typeof OrderListCompact>[0]> = {}) => (
  <OrderListCompact
    rows={[order({})]}
    currency="SGD"
    timezone="Asia/Singapore"
    trailing="readyBy"
    {...props}
  />
)

afterEach(() => vi.useRealTimers())

describe('OrderListCompact', () => {
  it('puts a whole order on two lines, nothing off the edge', () => {
    // The point of the component: the table's seven columns do not fit a phone,
    // and a sideways scroll hides the column you triage on. Each row carries
    // who and how much on one line, when on the next.
    wrap(list())

    expect(screen.getByText('#166 · Marcus Lim')).toBeTruthy()
    expect(screen.getByText('S$10.90')).toBeTruthy()
    expect(screen.getByText('13 Aug, 21:31')).toBeTruthy()
    // A list, not a table: nothing to sort, nothing to scroll sideways.
    expect(screen.queryByRole('columnheader')).toBeNull()
  })

  it('names the walk-in when there is no customer', () => {
    wrap(list({ rows: [order({ customerName: null })] }))

    expect(screen.getByText('#166 · Walk-in')).toBeTruthy()
  })

  it('says when the order should be ready, and flags the late ones', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-13T14:00:00Z'))

    wrap(
      list({
        rows: [
          order({ id: 'due', estimatedReadyAt: '2026-08-13T14:30:00.000Z' }),
          order({ id: 'late', orderNumber: 167, estimatedReadyAt: '2026-08-13T13:40:00.000Z' }),
        ],
      }),
    )

    expect(screen.getByText('Ready by 13 Aug, 22:30')).toBeTruthy()
    expect(screen.getByText('Ready by 13 Aug, 21:40 · overdue')).toHaveStyle({
      color: lightTheme.color.status.danger.fg,
    })
  })

  it('shows the status instead, where the list mixes them', () => {
    wrap(list({ trailing: 'status', rows: [order({ status: 'accepted' })] }))

    expect(screen.getByText('Accepted')).toBeTruthy()
  })

  it('opens the order on press', () => {
    const onRowPress = vi.fn()
    wrap(list({ onRowPress }))

    fireEvent.click(screen.getByText('#166 · Marcus Lim'))

    expect(onRowPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }))
  })

  it('holds its shape while loading and says so when empty', () => {
    const { unmount } = wrap(list({ loading: true }))
    expect(screen.queryByText('#166 · Marcus Lim')).toBeNull()
    unmount()

    wrap(list({ rows: [] }))
    expect(screen.getByText('Nothing here yet')).toBeTruthy()
  })
})
