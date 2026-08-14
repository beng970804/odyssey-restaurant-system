import type { OrderRow } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import {
  EmptyState,
  ErrorState,
  Inline,
  Skeleton,
  Stack,
  Text,
  focusRingStyle,
  useInteractionState,
  useTheme,
} from '@repo/ui'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { formatTime } from './formatting'
import { isOverdue } from './orderColumns'
import { OrderStatusBadge } from './OrderStatusBadge'

/**
 * The order tables' phone form: one order per row, two lines, nothing behind a
 * sideways scroll. A seven-column table on a 390px screen hides exactly the
 * columns a phone user came for — Total, Status, and the "Ready by" the pending
 * queue is triaged on — so below the breakpoint the tables swap to this.
 *
 * Same states as `Table` (loading, error, empty, loaded), same row-press
 * contract, same column definitions' facts — just composed vertically.
 */
export type OrderListCompactProps = {
  rows: OrderRow[]
  currency: string
  timezone: string
  /**
   * What the second line ends with. The pending queue shows when the kitchen
   * owes the food; lists that mix statuses show each row's own.
   */
  trailing: 'readyBy' | 'status'
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  onRowPress?: (row: OrderRow) => void
  emptyState?: ReactNode
}

export function OrderListCompact({
  rows,
  currency,
  timezone,
  trailing,
  loading = false,
  error = null,
  onRetry,
  onRowPress,
  emptyState,
}: OrderListCompactProps) {
  // Loading wins over empty: a slow list must never flash "nothing here".
  if (loading) return <OrderListCompactSkeleton />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (rows.length === 0) return <>{emptyState ?? <EmptyState title="Nothing here yet" />}</>

  return (
    <View>
      {rows.map((row) => (
        <CompactRow
          key={row.id}
          row={row}
          currency={currency}
          timezone={timezone}
          trailing={trailing}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
        />
      ))}
    </View>
  )
}

function CompactRow({
  row,
  currency,
  timezone,
  trailing,
  onPress,
}: {
  row: OrderRow
  currency: string
  timezone: string
  trailing: 'readyBy' | 'status'
  onPress?: () => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      focusable={Boolean(onPress)}
      disabled={!onPress}
      {...handlers}
      onPress={onPress}
      style={[
        {
          gap: theme.space.xs,
          paddingVertical: theme.space.md,
          borderBottomWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.subtle,
          backgroundColor: state.hovered && onPress ? theme.color.bg.inset : 'transparent',
        },
        focusRingStyle(theme, state),
      ]}
    >
      <Inline justify="space-between" gap="md">
        <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
          {`#${row.orderNumber} · ${row.customerName ?? 'Walk-in'}`}
        </Text>
        <Text variant="bodyStrong">{formatMoney(row.totalCents, currency)}</Text>
      </Inline>
      <Inline justify="space-between" gap="md">
        <Text variant="caption" color="muted">
          {formatTime(row.placedAt, timezone)}
        </Text>
        {trailing === 'status' ? (
          <OrderStatusBadge status={row.status} />
        ) : (
          <ReadyByLine row={row} timezone={timezone} />
        )}
      </Inline>
    </Pressable>
  )
}

/**
 * The table's "Ready by" cell, carrying its own label — a list row has no
 * column header to say what the second time means.
 */
function ReadyByLine({ row, timezone }: { row: OrderRow; timezone: string }) {
  const theme = useTheme()
  if (!row.estimatedReadyAt) return null

  const due = `Ready by ${formatTime(row.estimatedReadyAt, timezone)}`
  if (!isOverdue(row)) {
    return (
      <Text variant="caption" color="muted">
        {due}
      </Text>
    )
  }
  return (
    <Text variant="caption" style={{ color: theme.color.status.danger.fg }}>
      {`${due} · overdue`}
    </Text>
  )
}

/** The loaded rows' shape, so nothing shifts when the orders arrive. */
function OrderListCompactSkeleton() {
  const theme = useTheme()

  return (
    <View>
      {[0, 1, 2, 3].map((index) => (
        <Stack
          key={index}
          gap="xs"
          style={{
            paddingVertical: theme.space.md,
            borderBottomWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.subtle,
          }}
        >
          <Inline justify="space-between">
            <Skeleton width={140} height={14} />
            <Skeleton width={60} height={14} />
          </Inline>
          <Inline justify="space-between">
            <Skeleton width={90} height={12} />
            <Skeleton width={110} height={12} />
          </Inline>
        </Stack>
      ))}
    </View>
  )
}
