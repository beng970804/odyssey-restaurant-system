import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import type { StatusTone } from '../theme/types'
import { Text } from './Text'

export type BadgeProps = {
  children: ReactNode
  /**
   * A design-system tone, never a domain status. `ORDER_STATUS_TONE` maps an
   * order's status onto one of these, which is what lets Menu availability and
   * CRM reuse this component without it knowing what an Order is.
   */
  tone?: StatusTone
  size?: 'sm' | 'md'
  /**
   * Placement only. `alignSelf: 'flex-start'` below stops a badge stretching to
   * the width of a column it sits in, and that is the right default — but in a
   * centred row it also pins the badge to the top of the tallest thing beside
   * it, which is how the orders filter bar's "2 active" ended up sitting above
   * everything else on the row.
   */
  style?: StyleProp<ViewStyle>
}

export function Badge({ children, tone = 'neutral', size = 'md', style }: BadgeProps) {
  const theme = useTheme()
  const tokens = theme.color.status[tone]

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          borderWidth: theme.borderWidth.thin,
          borderRadius: theme.radius.full,
          paddingHorizontal: size === 'sm' ? theme.space.sm : theme.space.md,
          paddingVertical: size === 'sm' ? 2 : theme.space.xs,
        },
        style,
      ]}
    >
      <Text variant="caption" style={{ color: tokens.fg, fontWeight: '500', letterSpacing: 0.3 }}>
        {children}
      </Text>
    </View>
  )
}
