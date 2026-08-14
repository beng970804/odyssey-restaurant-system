import { Pressable, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState, type InteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import type { Theme } from '../theme/types'
import { overlayTransition } from './Overlay'
import { Spinner } from './Spinner'
import { Text } from './Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * A node when the icon is fixed, or a function when it should take its colour
 * from the variant it sits in — the same bargain NavItem strikes, and for the
 * same reason: the icon *set* is an application choice, the icon *colour* is a
 * design-system one, so no caller should be spelling out a hex here.
 */
export type ButtonIcon = ReactNode | ((state: { color: string; size: number }) => ReactNode)

export type ButtonProps = {
  children: ReactNode
  /** Leading icon. Trailing icons are not a thing this button does. */
  icon?: ButtonIcon
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

const HEIGHT: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 48 }

/** Matched to the line height of the label at each size, so the two align. */
const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 20 }

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
    // Disabled is a uniform dimming rather than a fourth palette per variant.
    opacity: disabled ? 0.5 : 1,
    ...focusRingStyle(theme, state),
  }

  const label: TextStyle = { color: tokens.fg, fontWeight: '500' }

  // `fg` is handed out alongside the label style because the icon needs the
  // colour as a value, not as a style object it cannot read back.
  return { container, label, fg: tokens.fg }
}

export function Button({
  children,
  icon,
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
      style={[
        styles.container,
        // Hover and press change the background; a settle rather than a snap.
        overlayTransition('background-color', 120),
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {/* The label stays mounted under the spinner, invisibly: it is what
          gives the button its width, and "Place order" must not narrow at the
          exact moment someone is watching it. */}
      <View
        aria-hidden={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          opacity: loading ? 0 : 1,
        }}
      >
        {typeof icon === 'function' ? icon({ color: styles.fg, size: ICON_SIZE[size] }) : icon}
        <Text variant={size === 'sm' ? 'caption' : 'bodyStrong'} style={styles.label}>
          {children}
        </Text>
      </View>
      {loading ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spinner
            size={size}
            tone={variant === 'primary' || variant === 'danger' ? 'inverse' : 'default'}
          />
        </View>
      ) : null}
    </Pressable>
  )
}
