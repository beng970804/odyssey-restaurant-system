import { getGetOrderQueryKey, unwrap, useGetOrder } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import {
  Badge,
  Divider,
  Drawer,
  ErrorState,
  Inline,
  Skeleton,
  Stack,
  Text,
  useTheme,
} from '@repo/ui'
import { CHANNEL_LABELS, formatTime } from './formatting'
import { OrderActionBar } from './OrderActionBar'
import { OrderStatusBadge } from './OrderStatusBadge'

type Props = {
  orderId: string | null
  onClose: () => void
  currency: string
  timezone: string
}

export function OrderDetailDrawer({ orderId, onClose, currency, timezone }: Props) {
  const theme = useTheme()
  const { data, isLoading, error, refetch } = useGetOrder(orderId ?? '', {
    // Skipped entirely until a row is opened, so closing the drawer stops the
    // request rather than fetching an empty id.
    query: { enabled: Boolean(orderId), queryKey: getGetOrderQueryKey(orderId ?? '') },
  })
  const order = unwrap(data)

  return (
    <Drawer
      open={Boolean(orderId)}
      onClose={onClose}
      title={order ? `Order #${order.orderNumber}` : 'Order'}
      footer={
        order ? (
          <OrderActionBar
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            }}
          />
        ) : null
      }
    >
      {isLoading ? (
        <Stack gap="md">
          <Skeleton height={24} width={160} />
          <Skeleton height={72} />
          <Skeleton height={120} />
        </Stack>
      ) : error ? (
        <ErrorState error={error as unknown as Error} onRetry={refetch} />
      ) : order ? (
        <Stack gap="xl">
          <Inline gap="sm" wrap>
            <OrderStatusBadge status={order.status} />
            <Badge tone="neutral">{CHANNEL_LABELS[order.channel] ?? order.channel}</Badge>
            <Text variant="caption" color="muted">
              {formatTime(order.placedAt, timezone)}
            </Text>
          </Inline>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Customer
            </Text>
            <Text variant="bodyStrong">{order.customer?.name ?? 'Walk-in'}</Text>
            {order.customer?.phone ? <Text color="muted">{order.customer.phone}</Text> : null}
          </Stack>

          <Stack gap="sm">
            <Text variant="caption" color="muted">
              Items
            </Text>
            {order.items.map((item) => (
              <Inline key={item.id} justify="space-between" align="flex-start">
                <Stack gap="xs" flex={1}>
                  {/* The frozen name, not the menu's current one (ADR 0001). */}
                  <Text>{`${item.quantity} × ${item.nameSnapshot}`}</Text>
                  {item.notes ? (
                    <Text variant="caption" color="muted">
                      {item.notes}
                    </Text>
                  ) : null}
                </Stack>
                <Text>{formatMoney(item.unitPriceCents * item.quantity, currency)}</Text>
              </Inline>
            ))}
          </Stack>

          <Stack
            gap="xs"
            style={{
              backgroundColor: theme.color.bg.inset,
              padding: theme.space.lg,
              borderRadius: theme.radius.md,
            }}
          >
            <ReceiptLine label="Subtotal" value={formatMoney(order.subtotalCents, currency)} />
            <ReceiptLine label="Tax" value={formatMoney(order.taxCents, currency)} />
            {order.deliveryFeeCents > 0 ? (
              <ReceiptLine label="Delivery" value={formatMoney(order.deliveryFeeCents, currency)} />
            ) : null}
            <Divider />
            <ReceiptLine label="Total" value={formatMoney(order.totalCents, currency)} strong />
          </Stack>

          {order.notes ? (
            <Stack gap="xs">
              <Text variant="caption" color="muted">
                Notes
              </Text>
              <Text>{order.notes}</Text>
            </Stack>
          ) : null}

          {order.cancellationReason ? (
            <Stack gap="xs">
              <Text variant="caption" color="muted">
                Cancellation reason
              </Text>
              <Text style={{ color: theme.color.status.danger.fg }}>
                {order.cancellationReason}
              </Text>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  )
}

function ReceiptLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <Inline justify="space-between">
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'primary' : 'muted'}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'}>{value}</Text>
    </Inline>
  )
}
