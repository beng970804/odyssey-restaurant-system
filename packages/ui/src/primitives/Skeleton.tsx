import { View, type DimensionValue } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

export type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: 'sm' | 'md' | 'full'
}

/** A placeholder shaped like the content it replaces, so nothing shifts. */
export function Skeleton({ width = '100%', height = 12, radius = 'sm' }: SkeletonProps) {
  const theme = useTheme()

  return (
    <View
      testID="skeleton"
      style={{
        width,
        height,
        borderRadius: theme.radius[radius],
        backgroundColor: theme.color.bg.inset,
      }}
    />
  )
}
