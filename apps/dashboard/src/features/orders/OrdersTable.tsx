import type { OrderRow } from '@repo/api-client'
import { EmptyState, Table, useBreakpoint } from '@repo/ui'
import { OrderListCompact } from './OrderListCompact'
import { pickOrderColumns } from './orderColumns'

/** Every column an order has, which is what the Orders screen is for. */
const COLUMNS = [
  'orderNumber',
  'placedAt',
  'customer',
  'channel',
  'items',
  'total',
  'status',
] as const

export function OrdersTable({
  rows,
  loading,
  refreshing = false,
  error,
  onRetry,
  onRowPress,
  currency,
  timezone,
  filtered,
}: {
  rows: OrderRow[]
  loading: boolean
  refreshing?: boolean
  error: Error | null
  onRetry: () => void
  onRowPress: (row: OrderRow) => void
  currency: string
  timezone: string
  filtered: boolean
}) {
  const { isCompact } = useBreakpoint()

  const emptyState = filtered ? (
    <EmptyState
      title="No orders match these filters"
      description="Try clearing a filter or widening the date range."
    />
  ) : (
    <EmptyState title="No orders yet" description="New orders will appear here." />
  )

  // Seven columns on a phone leave Total and Status behind a sideways scroll,
  // so below the breakpoint the same rows render as the two-line list. Decided
  // here, in the one component every orders list renders, rather than by each
  // screen — this list mixes statuses, so each row carries its own.
  if (isCompact) {
    return (
      <OrderListCompact
        rows={rows}
        currency={currency}
        timezone={timezone}
        trailing="status"
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={onRetry}
        onRowPress={onRowPress}
        emptyState={emptyState}
      />
    )
  }

  return (
    <Table
      columns={pickOrderColumns({ currency, timezone }, COLUMNS)}
      data={rows}
      keyExtractor={(row) => row.id}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRetry={onRetry}
      onRowPress={onRowPress}
      emptyState={emptyState}
    />
  )
}
