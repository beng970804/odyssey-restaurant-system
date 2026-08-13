import { unwrap, useGetSettings, useListOrders } from '@repo/api-client'
import { Button, Pagination, Stack } from '@repo/ui'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { NewOrderModal } from '../../../src/features/orders/NewOrderModal'
import { OrderDetailDrawer } from '../../../src/features/orders/OrderDetailDrawer'
import { OrderFilterBar } from '../../../src/features/orders/OrderFilterBar'
import { OrdersTable, type OrderRow } from '../../../src/features/orders/OrdersTable'
import { useOrderFilters } from '../../../src/features/orders/useOrderFilters'

export default function OrdersScreen() {
  const filters = useOrderFilters()
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const { data, isLoading, error, refetch } = useListOrders(filters.query)
  const list = unwrap(data)
  const settings = unwrap(useGetSettings().data)

  const currency = settings?.currency ?? 'SGD'
  const timezone = settings?.timezone ?? 'Asia/Singapore'

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
          rows={(list?.data ?? []) as OrderRow[]}
          loading={isLoading}
          error={error as Error | null}
          onRetry={refetch}
          onRowPress={(row) => setOpenOrderId(row.id)}
          currency={currency}
          timezone={timezone}
          filtered={filters.activeCount > 0}
        />

        {list && list.meta.total > list.meta.pageSize ? (
          <Pagination
            page={list.meta.page}
            pageSize={list.meta.pageSize}
            total={list.meta.total}
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
