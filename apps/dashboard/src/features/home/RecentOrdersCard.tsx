import { unwrap, useListOrders } from '@repo/api-client'
import { Button, Card, Inline, Stack, Text } from '@repo/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import { useTimezone } from '../../hooks/useTimezone'
import { OrderDetailDrawer } from '../orders/OrderDetailDrawer'
import { OrdersTable } from '../orders/OrdersTable'

/**
 * The last five orders, in the Orders screen's own table and drawer rather than
 * a second, thinner copy of them. A row opens the order in place: the dashboard
 * is where you notice something, so it should also be where you can look at it
 * — and, through the drawer's action bar, act on it.
 */
export function RecentOrdersCard() {
  const router = useRouter()
  const currency = useCurrency()
  const timezone = useTimezone()
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const { data, isLoading, error, refetch } = useListOrders({ pageSize: 5 })
  const rows = unwrap(data)?.data ?? []

  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Inline justify="space-between">
          <Text variant="h3">Recent orders</Text>
          <Button variant="ghost" size="sm" onPress={() => router.push('/orders')}>
            View all
          </Button>
        </Inline>

        {/* OrdersTable decides its own phone form, so this card does not. */}
        <OrdersTable
          rows={rows}
          loading={isLoading}
          error={error as Error | null}
          onRetry={refetch}
          onRowPress={(row) => setOpenOrderId(row.id)}
          currency={currency}
          timezone={timezone}
          // Nothing is filtered here, so the empty state is the plain one: no
          // orders yet, rather than none matching a filter.
          filtered={false}
        />
      </Stack>

      <OrderDetailDrawer
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        currency={currency}
        timezone={timezone}
      />
    </Card>
  )
}
