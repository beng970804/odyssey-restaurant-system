import { unwrap, useListOrders } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@repo/types'
import { Badge, Button, Card, Inline, Stack, Table, Text, type Column } from '@repo/ui'
import { useRouter } from 'expo-router'
import { toneForStatus } from '../orders/formatting'

type Row = {
  id: string
  orderNumber: number
  status: string
  customerName: string | null
  totalCents: number
}

export function RecentOrdersCard({ currency }: { currency: string }) {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useListOrders({ pageSize: 5 })
  const rows = (unwrap(data)?.data ?? []) as Row[]

  const columns: Column<Row>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      width: 90,
      render: (row) => <Text variant="bodyStrong">{`#${row.orderNumber}`}</Text>,
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
        <Badge tone={toneForStatus(row.status as OrderStatus)}>
          {ORDER_STATUS_LABELS[row.status as OrderStatus]}
        </Badge>
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
    <Card padding="lg">
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
