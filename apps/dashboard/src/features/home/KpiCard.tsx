import {
  Card,
  IconTile,
  Inline,
  Skeleton,
  Sparkline,
  Stack,
  Text,
  useBreakpoint,
  useCountUp,
} from '@repo/ui'
import { useCurrency } from '../../hooks/useCurrency'
import { figureTotal, formatFigure } from './kpiFigure'
import type { Kpi } from './useHomeSummary'

/**
 * Half a phone is about 150px of card. `S$3,412.03` at display size is wider
 * than that and runs out through the border, and the icon tile takes another 48
 * off the label — so the compact card spends its width on the two things that
 * are the card: what the number is, and what it says.
 */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const currency = useCurrency()
  const { isCompact } = useBreakpoint()
  const total = figureTotal(kpi.figure)
  const counted = useCountUp(total)

  return (
    <Card padding={isCompact ? 'md' : 'lg'} flex={1}>
      <Stack gap={isCompact ? 'sm' : 'md'}>
        <Inline justify="space-between" align="flex-start">
          {/* A title, not a footnote: 12px muted put the label below the hint
              in weight, when the label is the thing you scan a row of cards for. */}
          <Text variant="bodyStrong" color="secondary" style={{ flexShrink: 1 }}>
            {kpi.label}
          </Text>
          {kpi.icon && !isCompact ? <IconTile icon={kpi.icon} /> : null}
        </Inline>
        <Stack gap="xs">
          {/* The settled figure is the accessible one: a value counting up
              would have a screen reader announce every frame of it. */}
          <Text
            variant={isCompact ? 'h1' : 'display'}
            accessibilityLabel={formatFigure(kpi.figure, total, currency)}
          >
            {formatFigure(kpi.figure, counted, currency)}
          </Text>
          {/* The week's shape rides the hint row: hint left, movement right,
              so the card answers "how much" and "which way" in one glance. */}
          <Inline justify="space-between" align="flex-end" gap="md">
            {kpi.hint ? (
              <Text variant="caption" color="muted" style={{ flexShrink: 1 }}>
                {kpi.hint}
              </Text>
            ) : null}
            {kpi.trend ? (
              <Sparkline values={kpi.trend} height={20} label={`Last ${kpi.trend.length} days`} />
            ) : null}
          </Inline>
        </Stack>
      </Stack>
    </Card>
  )
}

/** The same shape as the loaded card, so nothing shifts when data arrives. */
export function KpiCardSkeleton() {
  const { isCompact } = useBreakpoint()

  return (
    <Card padding={isCompact ? 'md' : 'lg'} flex={1}>
      <Stack gap={isCompact ? 'sm' : 'md'}>
        <Inline justify="space-between" align="flex-start">
          <Skeleton width={90} height={14} />
          {isCompact ? null : <Skeleton width={36} height={36} radius="full" />}
        </Inline>
        <Stack gap="xs">
          <Skeleton width={isCompact ? 100 : 130} height={isCompact ? 24 : 32} />
          <Skeleton width={isCompact ? 80 : 110} height={12} />
        </Stack>
      </Stack>
    </Card>
  )
}
