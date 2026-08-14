import { Platform, View, type DimensionValue } from 'react-native'
import { prefersReducedMotion } from '../hooks/motion'
import { useTheme } from '../theme/ThemeProvider'

export type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: 'sm' | 'md' | 'full'
}

/**
 * React Native Web compiles `animationKeyframes` to a real CSS animation, so
 * the pulse runs without a frame of JavaScript — a loading screen is exactly
 * where the main thread is busy. Native does not know the property and shows
 * the resting block, which is the same thing reduced motion chooses.
 *
 * Narrowly typed rather than `ViewStyle`-asserted for the usual two-copies
 * reason (see `OverlayTransition`).
 */
const PULSE = {
  opacity: 1,
  animationKeyframes: { '50%': { opacity: 0.55 } },
  animationDuration: '1.6s',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'ease-in-out',
}

/** A placeholder shaped like the content it replaces, so nothing shifts. */
export function Skeleton({ width = '100%', height = 12, radius = 'sm' }: SkeletonProps) {
  const theme = useTheme()
  const pulsing = Platform.OS === 'web' && !prefersReducedMotion()

  return (
    <View
      testID="skeleton"
      style={[
        {
          width,
          height,
          borderRadius: theme.radius[radius],
          backgroundColor: theme.color.bg.inset,
        },
        pulsing ? PULSE : null,
      ]}
    />
  )
}
