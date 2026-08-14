import type { CustomerWithStats } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, EmptyState, Table, Text, type Column } from '@repo/ui'

/**
 * Rows are the generated `CustomerWithStats`, not a local shape: a column added
 * to the customers query arrives here typed, and one removed fails typecheck.
 */
export function CustomerTable({
  customers,
  loading,
  error,
  onRetry,
  onRowPress,
  onAddCustomer,
  currency,
  searching,
}: {
  customers: CustomerWithStats[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onRowPress: (customer: CustomerWithStats) => void
  onAddCustomer: () => void
  currency: string
  searching: boolean
}) {
  // CRM is the one list the server does not paginate, so the whole set is in
  // hand and sorting it client-side is honest rather than a half-truth about
  // page one. Phone is the only column not worth sorting.
  const columns: Column<CustomerWithStats>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (row) => <Text variant="bodyStrong">{row.name}</Text>,
    },
    {
      key: 'phone',
      header: 'Phone',
      width: 160,
      render: (row) => <Text color="muted">{row.phone ?? '—'}</Text>,
    },
    {
      key: 'orders',
      header: 'Orders',
      width: 90,
      align: 'right',
      sortable: true,
      sortValue: (row) => row.orderCount,
      render: (row) => <Text>{String(row.orderCount)}</Text>,
    },
    {
      key: 'spend',
      header: 'Lifetime spend',
      width: 150,
      align: 'right',
      sortable: true,
      // Cents, not the formatted string: "S$120.00" sorts before "S$30.00".
      sortValue: (row) => row.lifetimeSpendCents,
      render: (row) => (
        <Text variant="bodyStrong">{formatMoney(row.lifetimeSpendCents, currency)}</Text>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={customers}
      keyExtractor={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onRowPress={onRowPress}
      emptyState={
        <EmptyState
          title={searching ? 'No customers match that search' : 'No customers yet'}
          description={searching ? undefined : 'Walk-ins do not create customers automatically.'}
          action={<Button onPress={onAddCustomer}>Add customer</Button>}
        />
      }
    />
  )
}
