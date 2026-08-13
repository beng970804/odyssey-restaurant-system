import { Badge, Card, Skeleton, Stack, Text } from '@repo/ui'
import type { Kpi } from './useHomeSummary'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card padding="lg">
      <Stack gap="xs">
        <Text variant="caption" color="muted">
          {kpi.label}
        </Text>
        {kpi.tone ? (
          <Badge tone={kpi.tone}>{kpi.value}</Badge>
        ) : (
          <Text variant="display">{kpi.value}</Text>
        )}
        {kpi.hint ? (
          <Text variant="caption" color="muted">
            {kpi.hint}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

/** The same shape as the loaded card, so nothing shifts when data arrives. */
export function KpiCardSkeleton() {
  return (
    <Card padding="lg">
      <Stack gap="sm">
        <Skeleton width={90} height={12} />
        <Skeleton width={130} height={32} />
        <Skeleton width={110} height={12} />
      </Stack>
    </Card>
  )
}
