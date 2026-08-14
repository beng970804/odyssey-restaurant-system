import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import type { StatusTone } from '../theme/types'

export type MeterProps = {
  value: number
  max: number
  tone?: StatusTone
  /** Read out by assistive tech in place of "42 out of 180". */
  label: string
}

const TRACK_HEIGHT = 8

/**
 * One proportion, drawn. Not a chart: no axis, no scale, no library — a share
 * of a whole that a KPI card can carry under its number.
 */
export function Meter({ value, max, tone = 'neutral', label }: MeterProps) {
  const theme = useTheme()
  // A zero total is a real state on an empty restaurant, and 0/0 is NaN.
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0

  return (
    <View
      role="progressbar"
      aria-label={label}
      // Rounded because a caller may be feeding this a value mid-count-up, and
      // "4.37 of 60" is not a thing to read out.
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{
        height: TRACK_HEIGHT,
        borderRadius: theme.radius.full,
        backgroundColor: theme.color.bg.inset,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          borderRadius: theme.radius.full,
          backgroundColor: theme.color.status[tone].fg,
        }}
      />
    </View>
  )
}
