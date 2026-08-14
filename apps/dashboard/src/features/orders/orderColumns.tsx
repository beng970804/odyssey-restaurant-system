import type { OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Text, type Column } from '@repo/ui'
import { CHANNEL_LABELS, formatTime } from './formatting'
import { OrderStatusBadge } from './OrderStatusBadge'

export type OrderColumnKey =
  | 'orderNumber'
  | 'placedAt'
  | 'customer'
  | 'channel'
  | 'items'
  | 'total'
  | 'status'

/**
 * Every way an order is shown in a row, in one place.
 *
 * Three tables list orders — the Orders screen, the dashboard's recent five,
 * and the pending queue — and each wants a different subset of the same
 * columns. Written per table, they drift: the dashboard's copy lost Channel and
 * Items without anyone deciding it should. So the columns are defined once and
 * picked from, and a change to how an order number or a total is rendered
 * reaches all three.
 */
export function orderColumns({
  currency,
  timezone,
}: {
  currency: string
  timezone: string
}): Record<OrderColumnKey, Column<OrderRow>> {
  return {
    orderNumber: {
      key: 'orderNumber',
      header: 'Order',
      width: 90,
      render: (row) => <Text variant="bodyStrong">{`#${row.orderNumber}`}</Text>,
    },
    placedAt: {
      key: 'placedAt',
      header: 'Placed',
      width: 140,
      // The restaurant's clock, never the Worker's.
      render: (row) => <Text color="muted">{formatTime(row.placedAt, timezone)}</Text>,
    },
    customer: {
      key: 'customer',
      header: 'Customer',
      render: (row) => <Text>{row.customerName ?? 'Walk-in'}</Text>,
    },
    channel: {
      key: 'channel',
      header: 'Channel',
      width: 110,
      render: (row) => <Text color="muted">{CHANNEL_LABELS[row.channel] ?? row.channel}</Text>,
    },
    items: {
      key: 'items',
      header: 'Items',
      width: 70,
      align: 'right',
      render: (row) => <Text color="muted">{String(row.itemCount)}</Text>,
    },
    total: {
      key: 'total',
      header: 'Total',
      width: 110,
      align: 'right',
      render: (row) => <Text variant="bodyStrong">{formatMoney(row.totalCents, currency)}</Text>,
    },
    status: {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
  }
}

/** The subset a table wants, in the order it wants them. */
export function pickOrderColumns(
  settings: { currency: string; timezone: string },
  keys: readonly OrderColumnKey[],
): Column<OrderRow>[] {
  const all = orderColumns(settings)
  return keys.map((key) => all[key])
}
