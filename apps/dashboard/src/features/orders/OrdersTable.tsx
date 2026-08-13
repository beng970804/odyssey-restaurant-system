import type { OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { EmptyState, Table, Text, type Column } from '@repo/ui'
import { CHANNEL_LABELS, formatTime } from './formatting'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrdersTable({
  rows,
  loading,
  error,
  onRetry,
  onRowPress,
  currency,
  timezone,
  filtered,
}: {
  rows: OrderRow[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onRowPress: (row: OrderRow) => void
  currency: string
  timezone: string
  filtered: boolean
}) {
  const columns: Column<OrderRow>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      width: 90,
      render: (row) => <Text variant="bodyStrong">{`#${row.orderNumber}`}</Text>,
    },
    {
      key: 'placedAt',
      header: 'Placed',
      width: 140,
      render: (row) => <Text color="muted">{formatTime(row.placedAt, timezone)}</Text>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <Text>{row.customerName ?? 'Walk-in'}</Text>,
    },
    {
      key: 'channel',
      header: 'Channel',
      width: 110,
      render: (row) => <Text color="muted">{CHANNEL_LABELS[row.channel] ?? row.channel}</Text>,
    },
    {
      key: 'items',
      header: 'Items',
      width: 70,
      align: 'right',
      render: (row) => <Text color="muted">{String(row.itemCount)}</Text>,
    },
    {
      key: 'total',
      header: 'Total',
      width: 110,
      align: 'right',
      render: (row) => <Text variant="bodyStrong">{formatMoney(row.totalCents, currency)}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
  ]

  return (
    <Table
      columns={columns}
      data={rows}
      keyExtractor={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onRowPress={onRowPress}
      emptyState={
        filtered ? (
          <EmptyState
            title="No orders match these filters"
            description="Try clearing a filter or widening the date range."
          />
        ) : (
          <EmptyState title="No orders yet" description="New orders will appear here." />
        )
      }
    />
  )
}
