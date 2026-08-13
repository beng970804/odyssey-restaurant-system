import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Inline } from './Inline'
import { Text } from './Text'

export type SwitchProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  label?: string
  disabled?: boolean
}

const TRACK_WIDTH = 40
const KNOB = 16

export function Switch({ value, onValueChange, label, disabled = false }: SwitchProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  const control = (
    <Pressable
      role="switch"
      aria-checked={value}
      aria-label={label}
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
        focusRingStyle(theme, state),
      ]}
    >
      <View
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: theme.radius.full,
          backgroundColor: theme.color.bg.surface,
          transform: [{ translateX: value ? TRACK_WIDTH - KNOB - 8 : 0 }],
        }}
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
