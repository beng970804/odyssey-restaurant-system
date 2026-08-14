import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { focusRingStyle } from '../hooks/useFocusRing'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { Calendar, monthOf, type DateKey } from './Calendar'
import { Divider } from './Divider'
import { Popover } from './Popover'
import { Text } from './Text'

/** Both ends are calendar keys — 'YYYY-MM-DD' — and both are inclusive. */
export type DateRange = { from: string | null; to: string | null }

export type DateRangePickerProps = {
  value: DateRange
  onChange: (value: DateRange) => void
  /**
   * Today in the restaurant's timezone. The presets are anchored to it rather
   * than to the viewer's clock, which is the same reason the tables format
   * against settings.timezone.
   */
  today: DateKey
  placeholder?: string
}

const shiftDay = (key: DateKey, by: number): DateKey => {
  const date = new Date(`${key}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + by)
  return date.toISOString().slice(0, 10)
}

const firstOfMonth = (key: DateKey): DateKey => `${monthOf(key)}-01`

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const formatDay = (key: DateKey): string =>
  `${Number(key.slice(8))} ${SHORT_MONTHS[Number(key.slice(5, 7)) - 1]}`

/** What the closed control says. A range reads as a range, not as two fields. */
function label(value: DateRange, placeholder: string): string {
  if (value.from && value.to) {
    return value.from === value.to
      ? formatDay(value.from)
      : `${formatDay(value.from)} – ${formatDay(value.to)}`
  }
  if (value.from) return `From ${formatDay(value.from)}`
  if (value.to) return `Until ${formatDay(value.to)}`
  return placeholder
}

/**
 * A calendar, replacing the two YYYY-MM-DD text fields that stood here.
 *
 * Those fields were defensible while the range filter was "typed once for last
 * week", but they ask the operator to know today's date, to know the ISO
 * format, and to type eight digits without a typo to see yesterday's orders —
 * three demands a two-click calendar makes none of. The presets carry most of
 * the real traffic; the grid is there for the rest.
 */
export function DateRangePicker({
  value,
  onChange,
  today,
  placeholder = 'Any date',
}: DateRangePickerProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => monthOf(value.from ?? today))

  // Reopening shows the range being edited, not wherever the last visit was
  // left. Keyed on `open` alone on purpose: paging to July and then picking a
  // day must not snap the grid back to the month the range starts in.
  useEffect(() => {
    if (open) setMonth(monthOf(value.from ?? today))
  }, [open]) // oxlint-disable-line exhaustive-deps -- on open only

  /**
   * First press starts a range, second press closes it, third starts over.
   * Pressing a day before the start is read as "I meant to start there", not
   * as an invalid range — the alternative is an error message for a mistake
   * the picker can simply interpret.
   */
  const selectDay = (day: DateKey) => {
    if (value.from === null || value.to !== null) {
      onChange({ from: day, to: null })
      return
    }
    const [from, to] = day < value.from ? [day, value.from] : [value.from, day]
    onChange({ from, to })
    setOpen(false)
  }

  const preset = (from: DateKey, to: DateKey) => () => {
    onChange({ from, to })
    setOpen(false)
  }

  const text = label(value, placeholder)
  const chosen = value.from !== null || value.to !== null

  const panel = (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ padding: theme.space.xs, gap: 2, minWidth: 132 }}>
        <PresetRow label="Today" onPress={preset(today, today)} />
        <PresetRow label="Last 7 days" onPress={preset(shiftDay(today, -6), today)} />
        <PresetRow label="Last 30 days" onPress={preset(shiftDay(today, -29), today)} />
        <PresetRow label="This month" onPress={preset(firstOfMonth(today), today)} />
        <Divider />
        <PresetRow
          label="Any date"
          muted
          onPress={() => {
            onChange({ from: null, to: null })
            setOpen(false)
          }}
        />
      </View>
      <Divider orientation="vertical" />
      <Calendar
        month={month}
        onMonthChange={setMonth}
        from={value.from}
        to={value.to}
        onSelectDay={selectDay}
        today={today}
        maxDate={today}
      />
    </View>
  )

  return (
    <Popover open={open} onClose={() => setOpen(false)} content={panel} label="Choose a date range">
      <Pressable
        role="button"
        aria-haspopup="dialog"
        aria-expanded={open}
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
            backgroundColor: theme.color.bg.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
          },
          focusRingStyle(theme, state),
        ]}
      >
        <Text variant="caption" color="muted">
          🗓
        </Text>
        <Text variant="body" color={chosen ? 'primary' : 'muted'}>
          {text}
        </Text>
      </Pressable>
    </Popover>
  )
}

function PresetRow({
  label: text,
  onPress,
  muted = false,
}: {
  label: string
  onPress: () => void
  muted?: boolean
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  return (
    <Pressable
      role="button"
      focusable
      {...handlers}
      onPress={onPress}
      style={{
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.sm,
        backgroundColor: state.hovered ? theme.color.bg.inset : 'transparent',
      }}
    >
      <Text variant="body" color={muted ? 'muted' : 'primary'}>
        {text}
      </Text>
    </Pressable>
  )
}
