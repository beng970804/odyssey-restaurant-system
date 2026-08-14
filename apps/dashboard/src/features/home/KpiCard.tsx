import { Card, IconTile, Inline, Skeleton, Stack, Text, useCountUp } from '@repo/ui'
import type { Kpi } from './useHomeSummary'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const counted = useCountUp(kpi.amount)

  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Inline justify="space-between" align="flex-start">
          {/* A title, not a footnote: 12px muted put the label below the hint
              in weight, when the label is the thing you scan a row of cards for. */}
          <Text variant="bodyStrong" color="secondary">
            {kpi.label}
          </Text>
          {kpi.icon ? <IconTile icon={kpi.icon} /> : null}
        </Inline>
        <Stack gap="xs">
          {/* The settled figure is the accessible one: a value counting up
              would have a screen reader announce every frame of it. */}
          <Text variant="display" accessibilityLabel={kpi.format(kpi.amount)}>
            {kpi.format(counted)}
          </Text>
          {kpi.hint ? (
            <Text variant="caption" color="muted">
              {kpi.hint}
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  )
}

/** The same shape as the loaded card, so nothing shifts when data arrives. */
export function KpiCardSkeleton() {
  return (
    <Card padding="lg" flex={1}>
      <Stack gap="md">
        <Inline justify="space-between" align="flex-start">
          <Skeleton width={90} height={14} />
          <Skeleton width={36} height={36} radius="full" />
        </Inline>
        <Stack gap="xs">
          <Skeleton width={130} height={32} />
          <Skeleton width={110} height={12} />
        </Stack>
      </Stack>
    </Card>
  )
}
