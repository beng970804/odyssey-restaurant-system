import type { OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_STATUSES } from '@repo/types'
import { Text, useTheme, type Column } from '@repo/ui'
import { CHANNEL_LABELS, formatTime } from './formatting'
import { OrderStatusBadge } from './OrderStatusBadge'

export type OrderColumnKey =
  | 'orderNumber'
  | 'placedAt'
  | 'readyAt'
  | 'customer'
  | 'channel'
  | 'items'
  | 'total'
  | 'status'

/** Statuses where the kitchen still owes the food, so a past estimate is late. */
const STILL_COOKING = ['pending', 'accepted', 'preparing']

function ReadyByCell({ row, timezone }: { row: OrderRow; timezone: string }) {
  const theme = useTheme()
  if (!row.estimatedReadyAt) return <Text color="muted">—</Text>

  const overdue = STILL_COOKING.includes(row.status) && new Date(row.estimatedReadyAt) < new Date()
  if (!overdue) return <Text color="muted">{formatTime(row.estimatedReadyAt, timezone)}</Text>
  return (
    <Text style={{ color: theme.color.status.danger.fg }}>
      {`${formatTime(row.estimatedReadyAt, timezone)} · overdue`}
    </Text>
  )
}

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
      sortable: true,
      // Newest first, because an order number is a clock in disguise.
      sortDescFirst: true,
      sortValue: (row) => row.orderNumber,
      render: (row) => <Text variant="bodyStrong">{`#${row.orderNumber}`}</Text>,
    },
    placedAt: {
      key: 'placedAt',
      header: 'Placed',
      width: 140,
      sortable: true,
      sortDescFirst: true,
      // The ISO string, not the rendered "14 Aug, 00:55" — that sorts by day
      // name.
      sortValue: (row) => row.placedAt,
      // The restaurant's clock, never the Worker's.
      render: (row) => <Text color="muted">{formatTime(row.placedAt, timezone)}</Text>,
    },
    readyAt: {
      key: 'readyAt',
      header: 'Ready by',
      width: 160,
      sortable: true,
      // Soonest due first — the queue is triaged by who is waiting longest.
      sortDescFirst: false,
      sortValue: (row) => row.estimatedReadyAt ?? '',
      render: (row) => <ReadyByCell row={row} timezone={timezone} />,
    },
    customer: {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.customerName ?? 'Walk-in',
      render: (row) => <Text>{row.customerName ?? 'Walk-in'}</Text>,
    },
    channel: {
      key: 'channel',
      header: 'Channel',
      width: 110,
      // Not sortable: grouping by channel is what the channel filter is for,
      // and a sortable header that only reshuffles three values is noise.
      render: (row) => <Text color="muted">{CHANNEL_LABELS[row.channel] ?? row.channel}</Text>,
    },
    items: {
      key: 'items',
      header: 'Items',
      width: 70,
      align: 'right',
      sortable: true,
      sortDescFirst: true,
      sortValue: (row) => row.itemCount,
      render: (row) => <Text color="muted">{String(row.itemCount)}</Text>,
    },
    total: {
      key: 'total',
      header: 'Total',
      width: 110,
      align: 'right',
      sortable: true,
      sortDescFirst: true,
      // Cents, not "S$120.00" — the rendered string puts S$120.00 below S$30.00.
      sortValue: (row) => row.totalCents,
      render: (row) => <Text variant="bodyStrong">{formatMoney(row.totalCents, currency)}</Text>,
    },
    status: {
      key: 'status',
      header: 'Status',
      width: 130,
      sortable: true,
      // Earliest in the pipeline first, despite the numeric sort value: the
      // reason to sort by status is to find what still needs doing.
      sortDescFirst: false,
      // Lifecycle order, not alphabetical: sorting Status should walk the pass
      // from pending to completed, and "accepted, cancelled, completed" is not
      // an order anyone thinks in.
      sortValue: (row) => ORDER_STATUSES.indexOf(row.status),
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
