import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

export type SelectOption<T extends string> = { label: string; value: T }

export type SelectProps<T extends string> = {
  options: SelectOption<T>[]
  value: T | null
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  /** Adds a "clear" row that reports null through onClear. */
  onClear?: () => void
}

/**
 * A menu rather than a native picker: the same control, styled identically, on
 * web and native. The list closes on choice so a screen never manages its
 * open state.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  onClear,
}: SelectProps<T>) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()
  const [open, setOpen] = useState(false)

  const selected = options.find((option) => option.value === value)

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        focusable
        {...handlers}
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        style={[
          {
            height: 40,
            paddingHorizontal: theme.space.md,
            borderRadius: theme.radius.md,
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.color.border.default,
            backgroundColor: disabled ? theme.color.bg.inset : theme.color.bg.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space.sm,
            opacity: disabled ? 0.6 : 1,
          },
          focusRingStyle(theme, state),
        ]}
      >
        <Text variant="body" color={selected ? 'primary' : 'muted'}>
          {selected?.label ?? placeholder}
        </Text>
        <Text variant="caption" color="muted">
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>

      {open ? (
        <View
          // RN's Role union omits listbox; RNW forwards aria-* through as-is.
          aria-label="Options"
          style={[
            {
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              zIndex: 10,
              borderRadius: theme.radius.md,
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.color.border.default,
              backgroundColor: theme.color.bg.overlay,
              paddingVertical: theme.space.xs,
            },
            theme.elevation.overlay,
          ]}
        >
          {onClear ? (
            <SelectRow
              label="Any"
              muted
              onPress={() => {
                onClear()
                setOpen(false)
              }}
            />
          ) : null}
          {options.map((option) => (
            <SelectRow
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onPress={() => {
                onChange(option.value)
                setOpen(false)
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SelectRow({
  label,
  onPress,
  selected = false,
  muted = false,
}: {
  label: string
  onPress: () => void
  selected?: boolean
  muted?: boolean
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      role="option"
      aria-selected={selected}
      focusable
      {...handlers}
      onPress={onPress}
      style={{
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.sm,
        backgroundColor: state.hovered ? theme.color.bg.inset : 'transparent',
      }}
    >
      <Text variant="body" color={muted ? 'muted' : selected ? 'brand' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  )
}
