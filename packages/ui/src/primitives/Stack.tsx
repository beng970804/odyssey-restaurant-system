import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import type { SpaceToken } from '../theme/types'

export type StackProps = {
  children: ReactNode
  /** From the space scale, never a raw number. */
  gap?: SpaceToken
  align?: ViewStyle['alignItems']
  justify?: ViewStyle['justifyContent']
  flex?: number
  style?: StyleProp<ViewStyle>
}

/** Vertical rhythm. Every gap in the app is one of the seven space tokens. */
export function Stack({ children, gap = 'md', align, justify, flex, style }: StackProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        {
          flexDirection: 'column',
          gap: theme.space[gap],
          alignItems: align,
          justifyContent: justify,
          flex,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
