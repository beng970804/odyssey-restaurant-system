import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

export type SparklineProps = {
  /** Oldest first, newest last — the same order the trend endpoint returns. */
  values: number[]
  height?: number
  /** What assistive tech reads. The bars themselves are one image, not a list. */
  label?: string
}

/**
 * Below this, a bar disappears. A quiet day still draws a stub, so an empty
 * week reads as "nothing sold" rather than as a control that failed to render.
 */
const FLOOR = 2
const BAR_WIDTH = 6

/**
 * The shape of a week behind a figure, in plain Views.
 *
 * Deliberately not TanStack Charts: that library's DOM adapter makes
 * `TrendChart` web-only (ADR 0005), and a sparkline is seven rectangles — the
 * one chart in the app cheap enough to draw in primitives that already run
 * everywhere the app might.
 *
 * The newest bar is set apart in the brand colour because it is today — the
 * day the figure above it is being asked about. History stands behind it in
 * the border tone, which both themes carry at AA against a card.
 */
export function Sparkline({ values, height = 28, label }: SparklineProps) {
  const theme = useTheme()
  const ceiling = Math.max(...values, 1)

  return (
    <View
      role="img"
      aria-label={label}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.space.xs,
        height,
      }}
    >
      {values.map((value, index) => (
        <View
          // Positional identity is the honest one: day three is day three.
          key={index}
          style={{
            width: BAR_WIDTH,
            height: Math.max(FLOOR, Math.round((value / ceiling) * height)),
            backgroundColor:
              index === values.length - 1 ? theme.color.brand.default : theme.color.border.strong,
          }}
        />
      ))}
    </View>
  )
}
