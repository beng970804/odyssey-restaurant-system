import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import type { SpaceToken } from '../theme/types'

export type InlineProps = {
  children: ReactNode
  gap?: SpaceToken
  align?: ViewStyle['alignItems']
  justify?: ViewStyle['justifyContent']
  wrap?: boolean
  flex?: number
  style?: StyleProp<ViewStyle>
}

/** Stack's horizontal twin, so a row never means a bare flexDirection. */
export function Inline({
  children,
  gap = 'md',
  align = 'center',
  justify,
  wrap,
  flex,
  style,
}: InlineProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: theme.space[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          flex,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
