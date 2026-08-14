import type { OrderRow } from '@repo/api-client'
import { EmptyState, Table } from '@repo/ui'
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
  return (
    <Table
      columns={pickOrderColumns({ currency, timezone }, COLUMNS)}
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
