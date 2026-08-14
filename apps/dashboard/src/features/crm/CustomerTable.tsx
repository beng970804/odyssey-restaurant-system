import type { CustomerWithStats } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import {
  Button,
  EmptyState,
  ErrorState,
  Inline,
  Skeleton,
  Stack,
  Table,
  Text,
  focusRingStyle,
  useBreakpoint,
  useInteractionState,
  useTheme,
  type Column,
} from '@repo/ui'
import { Pressable, View } from 'react-native'

type CustomerTableProps = {
  customers: CustomerWithStats[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onRowPress: (customer: CustomerWithStats) => void
  onAddCustomer: () => void
  currency: string
  searching: boolean
}

/**
 * Rows are the generated `CustomerWithStats`, not a local shape: a column added
 * to the customers query arrives here typed, and one removed fails typecheck.
 *
 * On a phone the four columns render as a two-line list instead: sideways
 * scrolling hid Orders and Lifetime spend, which are what the list is ranked
 * by. Decided here so the screen does not write the branch.
 */
export function CustomerTable(props: CustomerTableProps) {
  const { isCompact } = useBreakpoint()
  return isCompact ? <CustomerListCompact {...props} /> : <CustomerTableWide {...props} />
}

function CustomerTableWide({
  customers,
  loading,
  error,
  onRetry,
  onRowPress,
  onAddCustomer,
  currency,
  searching,
}: CustomerTableProps) {
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
      emptyState={<CustomerEmptyState searching={searching} onAddCustomer={onAddCustomer} />}
    />
  )
}

function CustomerEmptyState({
  searching,
  onAddCustomer,
}: {
  searching: boolean
  onAddCustomer: () => void
}) {
  return (
    <EmptyState
      title={searching ? 'No customers match that search' : 'No customers yet'}
      description={searching ? undefined : 'Walk-ins do not create customers automatically.'}
      action={<Button onPress={onAddCustomer}>Add customer</Button>}
    />
  )
}

/** "3 orders", or "1 order" — beside the phone when there is one. */
function customerLine(row: CustomerWithStats): string {
  const orders = row.orderCount === 1 ? '1 order' : `${row.orderCount} orders`
  return row.phone ? `${row.phone} · ${orders}` : orders
}

/** The table's phone form: one customer per row, two lines, same states. */
function CustomerListCompact({
  customers,
  loading,
  error,
  onRetry,
  onRowPress,
  onAddCustomer,
  currency,
  searching,
}: CustomerTableProps) {
  if (loading) return <CustomerListSkeleton />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (customers.length === 0) {
    return <CustomerEmptyState searching={searching} onAddCustomer={onAddCustomer} />
  }

  return (
    <View>
      {customers.map((row) => (
        <CustomerRowCompact
          key={row.id}
          row={row}
          currency={currency}
          onPress={() => onRowPress(row)}
        />
      ))}
    </View>
  )
}

function CustomerRowCompact({
  row,
  currency,
  onPress,
}: {
  row: CustomerWithStats
  currency: string
  onPress: () => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      focusable
      {...handlers}
      onPress={onPress}
      style={[
        {
          gap: theme.space.xs,
          paddingVertical: theme.space.md,
          borderBottomWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.subtle,
          backgroundColor: state.hovered ? theme.color.bg.inset : 'transparent',
        },
        focusRingStyle(theme, state),
      ]}
    >
      <Inline justify="space-between" gap="md">
        <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
          {row.name}
        </Text>
        <Text variant="bodyStrong">{formatMoney(row.lifetimeSpendCents, currency)}</Text>
      </Inline>
      <Text variant="caption" color="muted">
        {customerLine(row)}
      </Text>
    </Pressable>
  )
}

/** The loaded rows' shape, so nothing shifts when the customers arrive. */
function CustomerListSkeleton() {
  const theme = useTheme()

  return (
    <View>
      {[0, 1, 2, 3].map((index) => (
        <Stack
          key={index}
          gap="xs"
          style={{
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.subtle,
          }}
        >
          <Inline justify="space-between">
            <Skeleton width={140} height={14} />
            <Skeleton width={70} height={14} />
          </Inline>
          <Skeleton width={160} height={12} />
        </Stack>
      ))}
    </View>
  )
}
