import { getGetCustomerQueryKey, unwrap, useGetCustomer } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_STATUS_LABELS } from '@repo/types'
import {
  Badge,
  Button,
  Card,
  Drawer,
  ErrorState,
  Grid,
  Inline,
  Skeleton,
  Stack,
  Text,
} from '@repo/ui'
import { useRouter } from 'expo-router'
import { toneForStatus } from '../orders/formatting'

export function CustomerDetailDrawer({
  customerId,
  onClose,
  currency,
}: {
  customerId: string | null
  onClose: () => void
  currency: string
}) {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useGetCustomer(customerId ?? '', {
    query: { enabled: Boolean(customerId), queryKey: getGetCustomerQueryKey(customerId ?? '') },
  })
  const customer = unwrap(data)

  const average =
    customer && customer.orderCount > 0
      ? Math.round(customer.lifetimeSpendCents / customer.orderCount)
      : 0

  return (
    <Drawer open={Boolean(customerId)} onClose={onClose} title={customer?.name ?? 'Customer'}>
      {isLoading ? (
        <Stack gap="md">
          <Skeleton height={72} />
          <Skeleton height={160} />
        </Stack>
      ) : error ? (
        <ErrorState error={error as unknown as Error} onRetry={refetch} />
      ) : customer ? (
        <Stack gap="xl">
          <Stack gap="xs">
            {customer.phone ? <Text color="muted">{customer.phone}</Text> : null}
            {customer.email ? <Text color="muted">{customer.email}</Text> : null}
            {customer.notes ? <Text>{customer.notes}</Text> : null}
          </Stack>

          <Grid columns={3} gap="sm">
            <Stat label="Orders" value={String(customer.orderCount)} />
            <Stat
              label="Lifetime spend"
              value={formatMoney(customer.lifetimeSpendCents, currency)}
            />
            <Stat label="Average order" value={formatMoney(average, currency)} />
          </Grid>

          <Stack gap="sm">
            <Text variant="bodyStrong">Recent orders</Text>
            {customer.recentOrders.length === 0 ? (
              <Text color="muted">No orders yet.</Text>
            ) : (
              customer.recentOrders.map((order) => (
                <Inline key={order.id} justify="space-between">
                  <Text>{`#${order.orderNumber}`}</Text>
                  <Badge tone={toneForStatus(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <Text>{formatMoney(order.totalCents, currency)}</Text>
                </Inline>
              ))
            )}
            {/* Reuses the orders screen's URL filters rather than building a
                second order list. */}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/orders?search=${encodeURIComponent(customer.name)}`)}
            >
              See all orders for this customer
            </Button>
          </Stack>
        </Stack>
      ) : null}
    </Drawer>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <Stack gap="xs">
        <Text variant="caption" color="muted">
          {label}
        </Text>
        <Text variant="h3">{value}</Text>
      </Stack>
    </Card>
  )
}
