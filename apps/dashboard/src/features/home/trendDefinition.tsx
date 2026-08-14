import { formatMoney } from '@repo/shared'
import { Card, Skeleton, Stack, Text, type Theme } from '@repo/ui'
import { barY, defineChart } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import type { StaticChartDefinition } from '@tanstack/charts/types'

export type TrendDay = { date: string; orderCount: number; revenueCents: number }

export const CHART_HEIGHT = 200

/** "2026-08-13" → "08-13". The year is redundant across seven days. */
export const shortDate = (date: string) => date.slice(5)

/**
 * What the tooltip says. Exported because it is the only place on this screen
 * where a figure is written as a sentence, and a sentence about money is worth
 * a test — it goes through `formatMoney` like every other figure.
 */
export function describeDay(day: TrendDay, currency: string) {
  const orders = day.orderCount === 1 ? '1 order' : `${day.orderCount} orders`
  return `${shortDate(day.date)}\n${formatMoney(day.revenueCents, currency)} · ${orders}`
}

/**
 * The chart both platforms draw, without either platform's chrome: marks,
 * scales and axes only. The web file adds the DOM tooltip and the motion
 * renderer's staged entrance; the native file adds the react-native tooltip.
 * Neither redefines a bar, which is the point of the split (ADR 0005).
 */
export function buildTrendDefinition({
  plotted,
  ceiling,
  currency,
  theme,
  stagger = 0,
}: {
  plotted: TrendDay[]
  /** The real week's peak, so a staged first paint keeps the final axis. */
  ceiling: number
  currency: string
  theme: Theme
  /** Ms between bars on entrance. Only the web's motion renderer reads it. */
  stagger?: number
  // Named explicitly because the inferred type reaches into the library's
  // unexported internals, which an exported function may not do (TS4058).
}): StaticChartDefinition<TrendDay, string, number> {
  return defineChart({
    // The library's palette is built for a white page. Handing it the four
    // colours it reasons with is what makes the axis legible in dark mode
    // instead of near-black text on a near-black card.
    theme: {
      foreground: theme.color.text.primary,
      muted: theme.color.text.muted,
      grid: theme.color.border.subtle,
      background: theme.color.bg.surface,
    },
    marks: [
      barY(plotted, {
        x: (day: TrendDay) => shortDate(day.date),
        // Cents all the way into the scale. The division to dollars happens
        // in the tick formatter and nowhere else.
        y: (day: TrendDay) => day.revenueCents,
        fill: theme.color.brand.default,
        radius: theme.radius.sm,
        // `key` is what lets an update retarget a bar instead of replacing
        // it, so a refetch moves the geometry that is already painted.
        key: (day: TrendDay) => day.date,
        // The bars arrive left to right, a day at a time, where a motion
        // renderer is present to read this; elsewhere it is inert config.
        motion: (context) => ({
          delay: context.phase === 'enter' ? context.datumIndex * stagger : 0,
        }),
      }),
    ],
    // `nearest-x` resolves the containing bar first, so the whole column is
    // the target rather than the few pixels at its top — and with no
    // distance limit the two days that took nothing still answer, which is
    // the point of asking a chart about an empty day.
    focus: 'nearest-x',
    maxFocusDistance: Number.POSITIVE_INFINITY,
    x: { scale: () => scaleBand().padding(0.25), axis: { line: false } },
    y: {
      // A configured instance rather than the factory: the factory would
      // infer its domain from whatever is plotted, and a staged flat first
      // paint would collapse the axis to zero before springing it back open.
      scale: scaleLinear().domain([0, ceiling]),
      nice: true,
      grid: true,
      axis: {
        line: false,
        ticks: { count: 4, format: (cents: number) => formatMoney(cents, currency) },
      },
    },
  })
}

/** The heading both platforms share, so the two cards cannot drift apart. */
export function TrendHeading() {
  return (
    <Stack gap="xs">
      <Text variant="h3">Last seven days</Text>
      <Text variant="caption" color="muted">
        Revenue by day, in the restaurant&apos;s timezone
      </Text>
    </Stack>
  )
}

/** The two facts the geometry carries, as text for assistive tech. */
export function trendAccessibility(days: TrendDay[], currency: string) {
  const total = days.reduce((sum, day) => sum + day.revenueCents, 0)
  return {
    label: `Revenue for the last ${days.length} days, ${formatMoney(total, currency)} in total`,
    description: days
      .map((day) => `${shortDate(day.date)}: ${formatMoney(day.revenueCents, currency)}`)
      .join(', '),
  }
}

/** The card's own shape, so the row does not resize when the week arrives. */
export function TrendChartSkeleton() {
  return (
    <Card padding="lg">
      <Stack gap="md">
        <Stack gap="xs">
          <Skeleton width={140} height={20} />
          <Skeleton width={220} height={12} />
        </Stack>
        <Skeleton height={CHART_HEIGHT} radius="md" />
      </Stack>
    </Card>
  )
}
