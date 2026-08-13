import { Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState, type InteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import type { Theme } from '../theme/types'
import { Spinner } from './Spinner'
import { Text } from './Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

const HEIGHT: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 48 }

type VisualState = InteractionState & { disabled: boolean }

function buttonStyles(theme: Theme, variant: ButtonVariant, size: ButtonSize, state: VisualState) {
  const { hovered, pressed, disabled } = state

  const palette: Record<
    ButtonVariant,
    { bg: string; hover: string; active: string; fg: string; border: string }
  > = {
    primary: {
      bg: theme.color.brand.default,
      hover: theme.color.brand.hover,
      active: theme.color.brand.active,
      fg: theme.color.brand.onBrand,
      border: 'transparent',
    },
    secondary: {
      bg: theme.color.bg.surface,
      hover: theme.color.bg.inset,
      active: theme.color.border.subtle,
      fg: theme.color.text.primary,
      border: theme.color.border.default,
    },
    ghost: {
      bg: 'transparent',
      hover: theme.color.bg.inset,
      active: theme.color.border.subtle,
      fg: theme.color.text.secondary,
      border: 'transparent',
    },
    danger: {
      bg: theme.color.status.danger.fg,
      hover: theme.color.status.danger.fg,
      active: theme.color.status.danger.border,
      fg: theme.color.text.onBrand,
      border: 'transparent',
    },
  }

  const tokens = palette[variant]
  const background = pressed ? tokens.active : hovered ? tokens.hover : tokens.bg

  const container: ViewStyle = {
    height: HEIGHT[size],
    paddingHorizontal: size === 'sm' ? theme.space.md : theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: tokens.border,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.space.sm,
    // Disabled is a uniform dimming rather than a fourth palette per variant.
    opacity: disabled ? 0.5 : 1,
    ...focusRingStyle(theme, state),
  }

  const label: TextStyle = { color: tokens.fg, fontWeight: '500' }

  return { container, label }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
}: ButtonProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()
  const isDisabled = disabled || loading
  const styles = buttonStyles(theme, variant, size, { ...state, disabled: isDisabled })

  return (
    <Pressable
      role="button"
      aria-disabled={isDisabled}
      aria-busy={loading}
      disabled={isDisabled}
      focusable
      {...handlers}
      onPress={onPress}
      style={[styles.container, fullWidth && { alignSelf: 'stretch' }, style]}
    >
      {loading ? (
        <Spinner
          size={size}
          tone={variant === 'primary' || variant === 'danger' ? 'inverse' : 'default'}
        />
      ) : (
        <Text variant={size === 'sm' ? 'caption' : 'bodyStrong'} style={styles.label}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
