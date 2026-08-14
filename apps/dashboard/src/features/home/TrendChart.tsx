import {
  Card,
  Stack,
  frameClockRuns,
  prefersReducedMotion,
  useDomFocusRing,
  useTheme,
} from '@repo/ui'
import { defineChart, type ChartPoint } from '@tanstack/charts'
import { motion } from '@tanstack/charts/motion'
import { Chart } from '@tanstack/charts/react/core'
import { tooltip } from '@tanstack/charts/tooltip'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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

/**
 * Revenue by day, drawn with TanStack Charts' DOM adapter.
 *
 * **This file is the web half of a platform split.** The DOM adapter renders
 * SVG elements directly — fine under React Native Web, where every `View` is
 * already a `div`, and broken on iOS and Android, which is what
 * `TrendChart.native.tsx` is for: Metro resolves the `.native` file on device,
 * and both draw the same definition from `trendDefinition.tsx` (ADR 0005).
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
    () => buildTrendDefinition({ plotted, ceiling, currency, theme, stagger: BAR_STAGGER }),
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

  const accessibility = trendAccessibility(days, currency)

  return (
    <Card padding="lg">
      <Stack gap="md">
        <TrendHeading />

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
          ariaLabel={accessibility.label}
          ariaDescription={accessibility.description}
        />
      </Stack>
    </Card>
  )
}
