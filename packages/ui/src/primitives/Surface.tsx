import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import type { ElevationToken, RadiusToken, SpaceToken } from '../theme/types'

export type SurfaceProps = {
  children?: ReactNode
  background?: 'canvas' | 'surface' | 'raised' | 'overlay' | 'inset'
  elevation?: ElevationToken
  padding?: SpaceToken
  radius?: RadiusToken
  bordered?: boolean
  flex?: number
  style?: StyleProp<ViewStyle>
}

/** Depth is chosen by intent — a surface never writes its own shadow. */
export function Surface({
  children,
  background = 'surface',
  elevation = 'flat',
  padding,
  radius = 'md',
  bordered = false,
  flex,
  style,
}: SurfaceProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          backgroundColor: theme.color.bg[background],
          borderRadius: theme.radius[radius],
          padding: padding ? theme.space[padding] : undefined,
          borderWidth: bordered ? theme.borderWidth.thin : 0,
          borderColor: theme.color.border.default,
          flex,
        },
        theme.elevation[elevation],
        style,
      ]}
    >
      {children}
    </View>
  )
}
