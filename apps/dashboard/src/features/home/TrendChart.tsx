import { formatMoney } from '@repo/shared'
import { Card, Stack, Text, useTheme } from '@repo/ui'
import { barY, defineChart } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { useMemo } from 'react'

export type TrendDay = { date: string; orderCount: number; revenueCents: number }

const CHART_HEIGHT = 200

/** "2026-08-13" → "08-13". The year is redundant across seven days. */
const shortDate = (date: string) => date.slice(5)

/**
 * Revenue by day, drawn with TanStack Charts.
 *
 * **This component is web-only.** It uses the library's DOM adapter, which
 * renders SVG elements directly — fine under React Native Web, where every
 * `View` is already a `div`, and broken on iOS and Android. The brief makes web
 * the requirement and native a bonus, so the trade is deliberate; the library
 * does ship a `react-native` adapter backed by `react-native-svg`, and swapping
 * to it is the work a native build would need (ADR 0005).
 *
 * Every colour comes from the theme rather than the library's defaults, so the
 * chart follows a light/dark switch like every other surface.
 */
export function TrendChart({ days, currency }: { days: TrendDay[]; currency: string }) {
  const theme = useTheme()

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(days, {
            x: (day: TrendDay) => shortDate(day.date),
            // Cents all the way into the scale. The division to dollars happens
            // in the tick formatter and nowhere else.
            y: (day: TrendDay) => day.revenueCents,
            fill: theme.color.brand.default,
            radius: theme.radius.sm,
          }),
        ],
        x: { scale: () => scaleBand().padding(0.25), axis: { line: false } },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            line: false,
            ticks: { count: 4, format: (cents: number) => formatMoney(cents, currency) },
          },
        },
      }),
    [days, currency, theme],
  )

  const total = days.reduce((sum, day) => sum + day.revenueCents, 0)

  return (
    <Card padding="lg">
      <Stack gap="md">
        <Stack gap="xs">
          <Text variant="h3">Last seven days</Text>
          <Text variant="caption" color="muted">
            Revenue by day, in the restaurant&apos;s timezone
          </Text>
        </Stack>

        <Chart
          definition={definition}
          height={CHART_HEIGHT}
          // A chart carries its values in geometry, which a screen reader cannot
          // see. These two carry the same facts as text — and through the same
          // money boundary, so raw cents never reach them either.
          ariaLabel={`Revenue for the last ${days.length} days, ${formatMoney(total, currency)} in total`}
          ariaDescription={days
            .map((day) => `${shortDate(day.date)}: ${formatMoney(day.revenueCents, currency)}`)
            .join(', ')}
        />
      </Stack>
    </Card>
  )
}
