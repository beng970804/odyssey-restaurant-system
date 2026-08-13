import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme, useBreakpoint } from '../theme/ThemeProvider'
import type { SpaceToken } from '../theme/types'

export type GridProps = {
  children: ReactNode
  /** Columns at the widest layout; narrow viewports collapse toward one. */
  columns?: number
  gap?: SpaceToken
  style?: StyleProp<ViewStyle>
}

/**
 * The 12-column grid from the tokens, expressed in flexbox because React Native
 * has no CSS Grid. Collapsing is decided here rather than per screen.
 */
export function Grid({ children, columns = 3, gap = 'lg', style }: GridProps) {
  const theme = useTheme()
  const { isCompact } = useBreakpoint()
  const effective = isCompact ? 1 : columns
  const gapValue = theme.space[gap]

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: gapValue }, style]}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <View
              // Grid children are positional, so the index is the identity.
              key={index}
              style={{
                flexBasis: `${100 / effective}%`,
                flexGrow: 0,
                flexShrink: 1,
                maxWidth: `${100 / effective}%`,
              }}
            >
              {child}
            </View>
          ))
        : children}
    </View>
  )
}
