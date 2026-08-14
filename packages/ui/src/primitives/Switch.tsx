import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Inline } from './Inline'
import { overlayTransition } from './Overlay'
import { Text } from './Text'

export type SwitchProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  /** Printed beside the control *and* used as its accessible name. */
  label?: string
  /**
   * The accessible name when the control must not print one — a switch in a
   * table row is named by its row, and repeating "Ngoh Hiang available" beside
   * every toggle says out loud what the row already says.
   */
  accessibilityLabel?: string
  disabled?: boolean
}

const TRACK_WIDTH = 40
const KNOB = 16

/** One clock for the knob's slide and the track's colour behind it. */
const TOGGLE_MS = 150

export function Switch({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  disabled = false,
}: SwitchProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  const control = (
    <Pressable
      role="switch"
      aria-checked={value}
      aria-label={label ?? accessibilityLabel}
      aria-disabled={disabled}
      disabled={disabled}
      focusable
      {...handlers}
      onPress={() => onValueChange(!value)}
      style={[
        {
          width: TRACK_WIDTH,
          height: 24,
          borderRadius: theme.radius.full,
          padding: 4,
          justifyContent: 'center',
          backgroundColor: value ? theme.color.brand.default : theme.color.border.strong,
          opacity: disabled ? 0.5 : 1,
        },
        overlayTransition('background-color', TOGGLE_MS),
        focusRingStyle(theme, state),
      ]}
    >
      <View
        testID="switch-knob"
        style={[
          {
            width: KNOB,
            height: KNOB,
            borderRadius: theme.radius.full,
            backgroundColor: theme.color.bg.surface,
            transform: [{ translateX: value ? TRACK_WIDTH - KNOB - 8 : 0 }],
          },
          overlayTransition('transform', TOGGLE_MS),
        ]}
      />
    </Pressable>
  )

  if (!label) return control

  return (
    <Inline gap="sm">
      {control}
      <Text variant="body">{label}</Text>
    </Inline>
  )
}
