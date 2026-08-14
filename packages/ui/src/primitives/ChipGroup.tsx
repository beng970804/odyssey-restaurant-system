import { Pressable, ScrollView, View } from 'react-native'
import { focusRingBleed, focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import type { NavItemIcon } from './NavItem'
import { Text } from './Text'

export type Chip<T extends string> = { value: T; label: string; icon?: NavItemIcon }

export type ChipGroupProps<T extends string> = {
  chips: Chip<T>[]
  value: T
  onChange: (value: T) => void
  /**
   * Chips overflow sideways by default rather than wrapping, so a long category
   * list stays one row deep and the table below it keeps its position.
   */
  scrollable?: boolean
}

/**
 * A row of filter pills — deliberately not a `Tabs` variant.
 *
 * Tabs switch between panels and are announced as a `tablist`; chips filter one
 * list that stays exactly where it is, and are announced as a `radiogroup`.
 * Sharing an implementation would mean lying to assistive technology about
 * which of those is happening, so the two stay separate components.
 */
export function ChipGroup<T extends string>({
  chips,
  value,
  onChange,
  scrollable = true,
}: ChipGroupProps<T>) {
  const theme = useTheme()

  const row = (
    <View role="radiogroup" style={{ flexDirection: 'row', gap: theme.space.sm }}>
      {chips.map((chip) => (
        <ChipButton
          key={chip.value}
          value={chip.value}
          label={chip.label}
          icon={chip.icon}
          selected={chip.value === value}
          onPress={() => onChange(chip.value)}
        />
      ))}
    </View>
  )

  if (!scrollable) return row

  // A scroller clips what overflows it, and the first chip's focus ring sits
  // outside the row on every side — so the content is inset by exactly the
  // ring's reach, and the scroller is told not to be squashed by whatever
  // column it lands in. Margin cancels the inset so chips stay flush left.
  const bleed = focusRingBleed(theme)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0, marginHorizontal: -bleed }}
      contentContainerStyle={{ padding: bleed }}
    >
      {row}
    </ScrollView>
  )
}

/** Matches NavItem, so an icon is the same size wherever it sits beside a label. */
const ICON_SIZE = 20

function ChipButton<T extends string>({
  value,
  label,
  icon,
  selected,
  onPress,
}: {
  value: T
  label: string
  icon?: NavItemIcon
  selected: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  // Selected is a solid brand fill; unselected is a quiet outline that fills in
  // on hover, so the row reads as one control rather than as several buttons.
  const background = selected
    ? theme.color.brand.default
    : state.hovered
      ? theme.color.bg.inset
      : theme.color.bg.surface

  const foreground = selected ? theme.color.brand.onBrand : theme.color.text.secondary

  return (
    <Pressable
      testID={`chip-${value}`}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      focusable
      {...handlers}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.full,
          borderWidth: theme.borderWidth.thin,
          borderColor: selected ? theme.color.brand.default : theme.color.border.default,
          backgroundColor: background,
        },
        focusRingStyle(theme, state),
      ]}
    >
      {typeof icon === 'function' ? icon({ color: foreground, size: ICON_SIZE }) : icon}
      <Text variant="bodyStrong" style={{ color: foreground }}>
        {label}
      </Text>
    </Pressable>
  )
}
