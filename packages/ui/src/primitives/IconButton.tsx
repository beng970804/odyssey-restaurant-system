import { Pressable } from 'react-native'
import type { ReactNode } from 'react'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { overlayTransition } from './Overlay'

export type IconButtonProps = {
  children: ReactNode
  /** Required: an icon alone tells assistive technology nothing. */
  label: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onPress?: () => void
  testID?: string
}

const SIZE = { sm: 28, md: 36, lg: 44 } as const

export function IconButton({
  children,
  label,
  size = 'md',
  disabled = false,
  onPress,
  testID,
}: IconButtonProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      testID={testID}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      focusable
      {...handlers}
      onPress={onPress}
      style={[
        {
          width: SIZE[size],
          height: SIZE[size],
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.md,
          backgroundColor: state.pressed
            ? theme.color.border.subtle
            : state.hovered
              ? theme.color.bg.inset
              : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        overlayTransition('background-color', 120),
        focusRingStyle(theme, state),
      ]}
    >
      {children}
    </Pressable>
  )
}
