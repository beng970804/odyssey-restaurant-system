import { Button, Pagination, Stack } from '@repo/ui'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { NewOrderModal } from '../../../src/features/orders/NewOrderModal'
import { OrderDetailDrawer } from '../../../src/features/orders/OrderDetailDrawer'
import { OrderFilterBar } from '../../../src/features/orders/OrderFilterBar'
import { OrdersTable } from '../../../src/features/orders/OrdersTable'
import { useOrders } from '../../../src/features/orders/useOrders'

export default function OrdersScreen() {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const { filters, orders, meta, isLoading, error, refetch, currency, timezone } = useOrders()

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, and what can be done with it."
        actions={<Button onPress={() => setCreating(true)}>New order</Button>}
      />

      <Stack gap="lg">
        <OrderFilterBar filters={filters} />

        <OrdersTable
          rows={orders}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onRowPress={(row) => setOpenOrderId(row.id)}
          currency={currency}
          timezone={timezone}
          filtered={filters.activeCount > 0}
        />

        {meta && meta.total > meta.pageSize ? (
          <Pagination
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            onPageChange={filters.setPage}
          />
        ) : null}
      </Stack>

      <OrderDetailDrawer
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        currency={currency}
        timezone={timezone}
      />

      <NewOrderModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
