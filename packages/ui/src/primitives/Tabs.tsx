import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

export type Tab<T extends string> = { value: T; label: string; count?: number }

export type TabsProps<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  const theme = useTheme()

  return (
    <View
      role="tablist"
      style={{
        flexDirection: 'row',
        gap: theme.space.xs,
        borderBottomWidth: theme.borderWidth.thin,
        borderColor: theme.color.border.default,
      }}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          label={tab.count === undefined ? tab.label : `${tab.label} (${tab.count})`}
          selected={tab.value === value}
          onPress={() => onChange(tab.value)}
        />
      ))}
    </View>
  )
}

function TabButton({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      role="tab"
      aria-selected={selected}
      focusable
      {...handlers}
      onPress={onPress}
      style={[
        {
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderBottomWidth: theme.borderWidth.medium,
          borderColor: selected ? theme.color.brand.default : 'transparent',
          backgroundColor: state.hovered && !selected ? theme.color.bg.inset : 'transparent',
        },
        focusRingStyle(theme, state),
      ]}
    >
      <Text variant="bodyStrong" color={selected ? 'brand' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  )
}
