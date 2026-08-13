import { View } from 'react-native'
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
}

export function Badge({ children, tone = 'neutral', size = 'md' }: BadgeProps) {
  const theme = useTheme()
  const tokens = theme.color.status[tone]

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: tokens.bg,
        borderColor: tokens.border,
        borderWidth: theme.borderWidth.thin,
        borderRadius: theme.radius.full,
        paddingHorizontal: size === 'sm' ? theme.space.sm : theme.space.md,
        paddingVertical: size === 'sm' ? 2 : theme.space.xs,
      }}
    >
      <Text variant="caption" style={{ color: tokens.fg, fontWeight: '500', letterSpacing: 0.3 }}>
        {children}
      </Text>
    </View>
  )
}
