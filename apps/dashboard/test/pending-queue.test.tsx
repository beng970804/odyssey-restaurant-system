import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PendingOrdersModal } from '../src/features/home/PendingOrdersModal'

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// jsdom's 0×0 window reads as compact, and the compact queue is a different
// component. The width is faked so both layouts can be pinned.
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

const order = (
  id: string,
  orderNumber: number,
  customerName: string | null,
  estimatedReadyAt: string | null = null,
) => ({
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
  estimatedReadyAt,
  placedAt: '2026-08-13T13:31:00.000Z',
  updatedAt: '2026-08-13T13:31:00.000Z',
})

const rows = [
  order('order-1', 166, 'Marcus Lim', '2026-08-13T14:30:00.000Z'),
  order('order-2', 167, null, '2026-08-13T13:40:00.000Z'),
]

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

const modal = () => <PendingOrdersModal open onClose={vi.fn()} />

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

  it('shows when each order should be ready, flagging the late ones', () => {
    // 22:00 in Singapore: order #166 is due at 22:30, #167 blew its 21:40 estimate.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-13T14:00:00Z'))
    try {
      wrap(modal())

      expect(screen.getByText('Ready by')).toBeTruthy()
      expect(screen.getByText('13 Aug, 22:30')).toBeTruthy()
      expect(screen.getByText(/13 Aug, 21:40.*overdue/)).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('trades the table for a list on a phone, keeping the same facts', () => {
    // Five columns on a 390px screen put "Ready by" — the column the queue is
    // triaged on — behind a sideways scroll. The list keeps every fact on the
    // screen at once.
    viewportWidth = 390
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-13T14:00:00Z'))
    try {
      wrap(modal())

      expect(screen.queryByRole('columnheader')).toBeNull()
      expect(screen.getByText('#166 · Marcus Lim')).toBeTruthy()
      expect(screen.getByText('#167 · Walk-in')).toBeTruthy()
      expect(screen.getByText('Ready by 13 Aug, 22:30')).toBeTruthy()
      expect(screen.getByText('Ready by 13 Aug, 21:40 · overdue')).toBeTruthy()

      // The same row press, the same drawer.
      fireEvent.click(screen.getByText('#166 · Marcus Lim'))
      expect(screen.getByRole('dialog', { name: 'Order' })).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
