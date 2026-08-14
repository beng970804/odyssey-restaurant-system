import { formatMoney } from '@repo/shared'
import {
  Card,
  Skeleton,
  Stack,
  Text,
  frameClockRuns,
  prefersReducedMotion,
  useDomFocusRing,
  useTheme,
} from '@repo/ui'
import { barY, defineChart, type ChartPoint } from '@tanstack/charts'
import { motion } from '@tanstack/charts/motion'
import { Chart } from '@tanstack/charts/react/core'
import { tooltip } from '@tanstack/charts/tooltip'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'

export type TrendDay = { date: string; orderCount: number; revenueCents: number }

const CHART_HEIGHT = 200

/**
 * The library's optional motion renderer rather than a hand-rolled tween: it
 * keeps updates keyed to painted geometry and snaps for `prefers-reduced-motion`
 * on its own.
 *
 * Its `initial` option is no use here. The React adapter pre-renders the SVG
 * into the container before mounting, so the renderer finds a chart already in
 * the DOM and treats it as adopted server markup — which it deliberately does
 * not replay an entrance for. The entrance below is therefore staged as an
 * *update*, which is the path that does animate.
 */
const RENDERER = motion<TrendDay, string, number>({
  transition: { type: 'spring', stiffness: 170, damping: 20 },
})

/** The bars arrive left to right, a day at a time, rather than all at once. */
const BAR_STAGGER = 60

/**
 * True from the tick after mount. The first paint draws the bars flat, and the
 * flip to real revenue is an update — the phase this renderer will animate.
 *
 * A timer rather than a frame, because the flip itself must happen even where
 * the probe above says the animation cannot.
 */
function useEnterAfterMount() {
  // The staged entrance hands the renderer a flat chart and lets it spring up,
  // and the renderer springs on the frame clock — so without one the bars would
  // sit flat indefinitely. `frameClockRuns` is what makes it paint the real
  // data outright instead.
  const [entered, setEntered] = useState(() => prefersReducedMotion() || !frameClockRuns())

  useEffect(() => {
    if (entered) return
    const timer = setTimeout(() => setEntered(true), 0)
    return () => clearTimeout(timer)
  }, [entered])

  return entered
}

/** "2026-08-13" → "08-13". The year is redundant across seven days. */
const shortDate = (date: string) => date.slice(5)

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
  const entered = useEnterAfterMount()
  // The chart's <svg> is focusable and is not ours to style inline, so the ring
  // is published as a rule instead of a prop.
  const focusRing = useDomFocusRing('trend-chart')

  // The axis is scaled from the real week in both states, so the flat first
  // paint and the sprung second one share a y-axis and only the bars move.
  const ceiling = Math.max(...days.map((day) => day.revenueCents), 0)
  const plotted = entered ? days : days.map((day) => ({ ...day, revenueCents: 0 }))

  const definition = useMemo(
    () =>
      defineChart({
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
            motion: (context) => ({
              delay: context.phase === 'enter' ? context.datumIndex * BAR_STAGGER : 0,
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
          // infer its domain from whatever is plotted, and the flat first paint
          // would collapse the axis to zero before springing it back open.
          scale: scaleLinear().domain([0, ceiling]),
          nice: true,
          grid: true,
          axis: {
            line: false,
            ticks: { count: 4, format: (cents: number) => formatMoney(cents, currency) },
          },
        },
      }),
    [plotted, ceiling, currency, theme],
  )

  const interactive = useMemo(
    () =>
      defineChart(definition, {
        tooltip: {
          use: tooltip,
          // Anchored to the bar and placed above it, which is where a pointer
          // sitting on the bar is not already covering.
          anchor: 'point',
          placement: 'top',
          format: (point: ChartPoint<TrendDay>) => describeDay(point.datum, currency),
        },
      }),
    [definition, currency],
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
          definition={interactive}
          renderer={RENDERER}
          className={focusRing}
          height={CHART_HEIGHT}
          // The tooltip surface is the library's own DOM, themed the way it
          // asks to be: every one of these is a documented custom property with
          // a system-colour fallback, and they inherit from the chart host.
          style={
            {
              '--ts-chart-tooltip-background': theme.color.bg.raised,
              '--ts-chart-tooltip-color': theme.color.text.primary,
              '--ts-chart-tooltip-border': `${theme.borderWidth.thin}px solid ${theme.color.border.default}`,
              '--ts-chart-tooltip-border-radius': `${theme.radius.md}px`,
              '--ts-chart-tooltip-font': `500 ${theme.typography.caption.fontSize}px/1.5 system-ui, sans-serif`,
            } as CSSProperties
          }
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
