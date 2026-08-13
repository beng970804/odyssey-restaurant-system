import { TextInput, type TextInputProps } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'

export type InputProps = {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  multiline?: boolean
  numberOfLines?: number
  keyboardType?: TextInputProps['keyboardType']
  ariaLabel?: string
}

export function Input({
  value,
  onChangeText,
  placeholder,
  error = false,
  disabled = false,
  multiline = false,
  numberOfLines,
  keyboardType,
  ariaLabel,
}: InputProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.color.text.muted}
      editable={!disabled}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      aria-label={ariaLabel ?? placeholder}
      aria-invalid={error}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      style={[
        {
          minHeight: multiline ? 88 : 40,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.md,
          borderWidth: theme.borderWidth.thin,
          // An invalid field is red at rest, not only once it is focused.
          borderColor: error ? theme.color.status.danger.fg : theme.color.border.default,
          backgroundColor: disabled ? theme.color.bg.inset : theme.color.bg.surface,
          color: theme.color.text.primary,
          opacity: disabled ? 0.6 : 1,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        theme.typography.body,
        focusRingStyle(theme, state),
      ]}
    />
  )
}
