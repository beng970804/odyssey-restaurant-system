import {
  Badge,
  Button,
  Card,
  IconTile,
  Inline,
  Meter,
  Skeleton,
  Stack,
  Text,
  useCountUp,
} from '@repo/ui'
import IconClockHour4 from '@tabler/icons-react-native/IconClockHour4'
import { useState } from 'react'
import { PendingOrdersModal } from './PendingOrdersModal'
import type { Pending } from './useHomeSummary'

/** Hoisted: an icon defined inside the card would be a new component per render. */
const clockIcon = ({ color, size }: { color: string; size: number }) => (
  <IconClockHour4 color={color} size={size} />
)

/**
 * The wide cell of the top row. Pending is the one figure on this screen that
 * is a job rather than a fact, so it is the one that gets the room, the share
 * of the book it represents, and the way through to acting on it.
 */
export function PendingCard({
  pending,
  currency,
  timezone,
}: {
  pending: Pending
  currency: string
  timezone: string
}) {
  // The queue opens over the dashboard rather than navigating away from it: the
  // question "what is waiting?" is worth answering without losing the screen
  // that asked it.
  const [reviewing, setReviewing] = useState(false)
  // One clock for the number and the bar beneath it, so they arrive together.
  const counted = useCountUp(pending.count)

  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md" flex={1}>
        <Inline justify="space-between" align="flex-start">
          <Text variant="bodyStrong" color="secondary">
            Pending
          </Text>
          <IconTile icon={clockIcon} tone={pending.tone} />
        </Inline>

        <Inline gap="md" align="baseline">
          <Text variant="display" accessibilityLabel={pending.value}>
            {Math.round(counted)}
          </Text>
          <Text variant="caption" color="muted">
            {pending.caption}
          </Text>
        </Inline>

        <Meter
          value={counted}
          max={pending.total}
          tone={pending.tone}
          label={`${pending.value} of ${pending.total} orders awaiting a decision`}
        />

        <Inline justify="space-between">
          <Badge tone={pending.tone}>
            {pending.count > 0 ? 'Awaiting a decision' : 'Nothing waiting'}
          </Badge>
          <Button variant="ghost" size="sm" onPress={() => setReviewing(true)}>
            Review orders
          </Button>
        </Inline>
      </Stack>
      {reviewing ? (
        <PendingOrdersModal
          onClose={() => setReviewing(false)}
          currency={currency}
          timezone={timezone}
        />
      ) : null}
    </Card>
  )
}

export function PendingCardSkeleton() {
  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Inline justify="space-between" align="flex-start">
          <Skeleton width={70} height={14} />
          <Skeleton width={36} height={36} radius="full" />
        </Inline>
        <Skeleton width={130} height={32} />
        <Skeleton height={8} radius="full" />
        <Skeleton width={150} height={24} radius="full" />
      </Stack>
    </Card>
  )
}
