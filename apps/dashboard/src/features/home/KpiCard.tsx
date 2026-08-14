import { Card, IconTile, Inline, Skeleton, Stack, Text, useCountUp } from '@repo/ui'
import { useCurrency } from '../../hooks/useCurrency'
import { figureTotal, formatFigure } from './kpiFigure'
import type { Kpi } from './useHomeSummary'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const currency = useCurrency()
  const total = figureTotal(kpi.figure)
  const counted = useCountUp(total)

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
          <Text variant="display" accessibilityLabel={formatFigure(kpi.figure, total, currency)}>
            {formatFigure(kpi.figure, counted, currency)}
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
