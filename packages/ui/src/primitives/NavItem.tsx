import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

export type NavItemProps = {
  href: string
  label: string
  icon?: ReactNode
  badge?: number
  active?: boolean
  collapsed?: boolean
  onPress?: (href: string) => void
}

/** Knows nothing about routing: it reports an href and renders a state. */
export function NavItem({
  href,
  label,
  icon,
  badge,
  active = false,
  collapsed = false,
  onPress,
}: NavItemProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  const background = active
    ? theme.color.brand.subtle
    : state.hovered
      ? theme.color.bg.inset
      : 'transparent'

  return (
    <Pressable
      testID={`nav-item-${label.toLowerCase().replaceAll(' ', '-')}`}
      role="link"
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      focusable
      {...handlers}
      onPress={() => onPress?.(href)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: theme.space.sm,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.md,
          backgroundColor: background,
        },
        focusRingStyle(theme, state),
      ]}
    >
      {icon}
      {collapsed ? null : (
        <Text variant="bodyStrong" color={active ? 'brand' : 'secondary'}>
          {label}
        </Text>
      )}
      {badge !== undefined && badge > 0 ? (
        <View
          style={{
            marginLeft: collapsed ? 0 : 'auto',
            minWidth: 20,
            paddingHorizontal: theme.space.xs,
            paddingVertical: 1,
            borderRadius: theme.radius.full,
            backgroundColor: theme.color.status.warning.bg,
            alignItems: 'center',
          }}
        >
          <Text variant="caption" style={{ color: theme.color.status.warning.fg }}>
            {String(badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}
