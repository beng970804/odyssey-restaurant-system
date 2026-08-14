import { unwrap, useListOrders, type OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, EmptyState, Modal, Table, Text, type Column } from '@repo/ui'
import { useRouter } from 'expo-router'
import { formatTime } from '../orders/formatting'

/** The whole queue, not a page of it — five pending orders is a busy lunch. */
const PENDING_QUERY = { status: 'pending', pageSize: 20 } as const

/**
 * The queue behind the Pending card, without leaving the dashboard.
 *
 * Every row is still a way into Orders, because that is where an order can be
 * accepted or cancelled — this reads the queue, the other screen works it.
 */
export function PendingOrdersModal({
  onClose,
  currency,
  timezone,
}: {
  onClose: () => void
  currency: string
  timezone: string
}) {
  const router = useRouter()
  // Mounted only while open, so the queue is fetched when it is asked for and
  // the card behind it needs no query client of its own.
  const { data, isLoading, error, refetch } = useListOrders(PENDING_QUERY)
  const rows = unwrap(data)?.data ?? []

  const openInOrders = (row: OrderRow) => {
    onClose()
    router.push(`/orders?search=${row.orderNumber}`)
  }

  const columns: Column<OrderRow>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      width: 80,
      render: (row) => <Text variant="bodyStrong">{`#${row.orderNumber}`}</Text>,
    },
    {
      key: 'placedAt',
      header: 'Placed',
      width: 130,
      render: (row) => <Text color="muted">{formatTime(row.placedAt, timezone)}</Text>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <Text>{row.customerName ?? 'Walk-in'}</Text>,
    },
    {
      key: 'total',
      header: 'Total',
      width: 100,
      align: 'right',
      render: (row) => <Text>{formatMoney(row.totalCents, currency)}</Text>,
    },
  ]

  return (
    <Modal open onClose={onClose} title="Orders awaiting a decision" width={640}>
      <Table
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={error as Error | null}
        onRetry={refetch}
        onRowPress={openInOrders}
        emptyState={
          <EmptyState
            title="Nothing waiting"
            description="Every order has been accepted or closed."
          />
        }
      />

      <Button
        variant="ghost"
        size="sm"
        onPress={() => {
          onClose()
          router.push('/orders')
        }}
      >
        Open the Orders screen
      </Button>
    </Modal>
  )
}
