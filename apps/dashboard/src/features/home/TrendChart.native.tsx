import { Card, Stack, useTheme } from '@repo/ui'
import { defineChart, type ChartPoint } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react-native'
import { tooltip } from '@tanstack/charts/react-native/tooltip'
import { useMemo } from 'react'
import {
  CHART_HEIGHT,
  TrendHeading,
  buildTrendDefinition,
  describeDay,
  trendAccessibility,
  type TrendDay,
} from './trendDefinition'

export { TrendChartSkeleton, describeDay, type TrendDay } from './trendDefinition'

/**
 * The native half of the platform split (ADR 0005): the same definition as the
 * web chart, drawn by the library's react-native adapter over react-native-svg
 * instead of the DOM. Metro resolves this file on iOS and Android; the web —
 * and every test, which runs under jsdom — never sees it.
 *
 * No staged entrance here: the motion renderer is a DOM module, and a chart
 * that simply appears is better than one animated by hand in a second way.
 */
export function TrendChart({ days, currency }: { days: TrendDay[]; currency: string }) {
  const theme = useTheme()

  const ceiling = Math.max(...days.map((day) => day.revenueCents), 0)

  const definition = useMemo(
    () => buildTrendDefinition({ plotted: days, ceiling, currency, theme }),
    [days, ceiling, currency, theme],
  )

  const interactive = useMemo(
    () =>
      defineChart(definition, {
        tooltip: {
          use: tooltip,
          anchor: 'point',
          placement: 'top',
          format: (point: ChartPoint<TrendDay>) => describeDay(point.datum, currency),
        },
      }),
    [definition, currency],
  )

  const accessibility = trendAccessibility(days, currency)

  return (
    <Card padding="lg">
      <Stack gap="md">
        <TrendHeading />
        <Chart
          definition={interactive}
          height={CHART_HEIGHT}
          accessibilityLabel={accessibility.label}
          accessibilityHint={accessibility.description}
        />
      </Stack>
    </Card>
  )
}
