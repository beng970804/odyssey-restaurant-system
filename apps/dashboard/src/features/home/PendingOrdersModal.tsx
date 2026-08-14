import { getListOrdersQueryKey, unwrap, useListOrders, type OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, EmptyState, Modal, Table, Text, type Column } from '@repo/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { formatTime } from '../orders/formatting'
import { OrderDetailDrawer } from '../orders/OrderDetailDrawer'

/** The whole queue, not a page of it — five pending orders is a busy lunch. */
const PENDING_QUERY = { status: 'pending', pageSize: 20 } as const

/**
 * The queue behind the Pending card, without leaving the dashboard.
 *
 * A row opens the order in the same drawer the Orders screen uses, so the whole
 * of it is there — the receipt, the notes, and the action bar that accepts or
 * cancels it. The list needs no buttons of its own.
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
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)

  // Mounted whether or not it is open, so it can animate out — but the queue is
  // only fetched once someone asks to see it.
  const { data, isLoading, error, refetch } = useListOrders(PENDING_QUERY, {
    query: { enabled: open, queryKey: getListOrdersQueryKey(PENDING_QUERY) },
  })
  const rows = unwrap(data)?.data ?? []

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
    <>
      <Modal
        open={open}
        // Escape reaches both this and the drawer above it, and this listener
        // runs first. Ignoring it while an order is open means Escape closes
        // the order and leaves the queue standing, rather than clearing both.
        onClose={() => {
          if (!openOrderId) onClose()
        }}
        title="Orders awaiting a decision"
        width={640}
      >
        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          error={error as Error | null}
          onRetry={refetch}
          onRowPress={(row) => setOpenOrderId(row.id)}
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

      {/* Outside the Modal, so it is not unmounted with it — and mounted after,
          so it paints above the queue it was opened from. */}
      <OrderDetailDrawer
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        currency={currency}
        timezone={timezone}
      />
    </>
  )
}
