import { unwrap, useListOrders, type OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_STATUS_LABELS } from '@repo/types'
import { Badge, Button, Card, Inline, Stack, Table, Text, type Column } from '@repo/ui'
import { useRouter } from 'expo-router'
import { formatTime, toneForStatus } from '../orders/formatting'

export function RecentOrdersCard({ currency, timezone }: { currency: string; timezone: string }) {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useListOrders({ pageSize: 5 })
  const rows = unwrap(data)?.data ?? []

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
      // The same formatter the Orders screen uses, and the same timezone rule:
      // the restaurant's clock, never the Worker's.
      render: (row) => <Text color="muted">{formatTime(row.placedAt, timezone)}</Text>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <Text color="muted">{row.customerName ?? 'Walk-in'}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (row) => (
        <Badge tone={toneForStatus(row.status)}>{ORDER_STATUS_LABELS[row.status]}</Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      width: 110,
      align: 'right',
      render: (row) => <Text>{formatMoney(row.totalCents, currency)}</Text>,
    },
  ]

  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Inline justify="space-between">
          <Text variant="h3">Recent orders</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/orders')}>
            View all
          </Button>
        </Inline>
        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          error={error as Error | null}
          onRetry={refetch}
          onRowPress={(row) => router.push(`/orders?search=${row.orderNumber}`)}
        />
      </Stack>
    </Card>
  )
}
