import { Button, Pagination, Stack } from '@repo/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { OrderDetailDrawer } from '../../../src/features/orders/OrderDetailDrawer'
import { OrderFilterBar } from '../../../src/features/orders/OrderFilterBar'
import { OrdersTable } from '../../../src/features/orders/OrdersTable'
import { useOrders } from '../../../src/features/orders/useOrders'

export default function OrdersScreen() {
  const router = useRouter()
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)

  const { filters, orders, meta, isLoading, refreshing, error, refetch, currency, timezone } =
    useOrders()

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, and what can be done with it."
        actions={<Button onPress={() => router.push('/orders/new')}>New order</Button>}
      />

      <Stack gap="lg">
        <OrderFilterBar filters={filters} />

        <OrdersTable
          rows={orders}
          loading={isLoading}
          refreshing={refreshing}
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
    </>
  )
}
