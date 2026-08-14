import { getListOrdersQueryKey, unwrap, useListOrders, type OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_ACTION_LABELS } from '@repo/types'
import { Button, EmptyState, Inline, Modal, Table, Text, type Column } from '@repo/ui'
import { useRouter } from 'expo-router'
import { formatTime } from '../orders/formatting'
import { useOrderActions } from '../orders/useOrderActions'

/**
 * The decision, taken from the row. Every order in this list is Pending, so the
 * transition map offers exactly Accept and Cancel — and Cancel demands a reason
 * the API will not accept without, which is a form, not a quick action. So the
 * button here is Accept, and Cancel is a step into the order itself.
 *
 * The row is not pressable in this table: a press on the button would fire the
 * row's handler too, and accepting an order must not also navigate away from
 * the list you are working through.
 */
function RowActions({ order, onOpenOrder }: { order: OrderRow; onOpenOrder: () => void }) {
  const { availableActions, perform, isPending } = useOrderActions(order)

  return (
    <Inline gap="sm" justify="flex-end">
      <Button variant="ghost" size="sm" onPress={onOpenOrder}>
        Open
      </Button>
      {availableActions.includes('accept') ? (
        <Button size="sm" loading={isPending} onPress={() => perform('accept')}>
          {ORDER_ACTION_LABELS.accept}
        </Button>
      ) : null}
    </Inline>
  )
}

/** The whole queue, not a page of it — five pending orders is a busy lunch. */
const PENDING_QUERY = { status: 'pending', pageSize: 20 } as const

/**
 * The queue behind the Pending card, without leaving the dashboard.
 *
 * Every row is still a way into Orders, because that is where an order can be
 * accepted or cancelled — this reads the queue, the other screen works it.
 */
export function PendingOrdersModal({
  open,
  onClose,
  currency,
  timezone,
}: {
  open: boolean
  onClose: () => void
  currency: string
  timezone: string
}) {
  const router = useRouter()
  // Mounted whether or not it is open, so it can animate out — but the queue is
  // only fetched once someone asks to see it.
  const { data, isLoading, error, refetch } = useListOrders(PENDING_QUERY, {
    query: { enabled: open, queryKey: getListOrdersQueryKey(PENDING_QUERY) },
  })
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
    {
      key: 'decide',
      header: 'Decide',
      width: 190,
      align: 'right',
      render: (row) => <RowActions order={row} onOpenOrder={() => openInOrders(row)} />,
    },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Orders awaiting a decision" width={640}>
      <Table
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={error as Error | null}
        onRetry={refetch}
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
