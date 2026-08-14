import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useInteractionState } from '../hooks/useInteractionState'
import { useTheme } from '../theme/ThemeProvider'
import { IconButton } from './IconButton'
import { Inline } from './Inline'
import { Text } from './Text'

/**
 * Dates here are calendar keys — 'YYYY-MM-DD' — never Date objects.
 *
 * A day has no instant until a timezone is applied, and applying one at the
 * point of *display* is how a picker ends up showing yesterday to anyone west
 * of the server. Keys compare and sort as strings, so this whole file is
 * arithmetic on 'YYYY-MM' and 'YYYY-MM-DD' with no clock involved.
 */
export type DateKey = string

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const CELL = 36

const pad = (n: number) => String(n).padStart(2, '0')

export const monthOf = (key: DateKey): string => key.slice(0, 7)

export const shiftMonth = (month: string, by: number): string => {
  const [year, index] = month.split('-').map(Number)
  const total = year! * 12 + (index! - 1) + by
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

export const formatMonth = (month: string): string => {
  const [year, index] = month.split('-').map(Number)
  return `${MONTHS[index! - 1]} ${year}`
}

/**
 * The days of `month`, padded out to whole weeks with the neighbouring months'
 * days so the grid is a rectangle and the columns stay under their weekday.
 * Monday-first: the restaurant's week is not the calendar app's.
 */
function monthGrid(month: string): { key: DateKey; inMonth: boolean }[] {
  const [year, index] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year!, index! - 1, 1))
  // getUTCDay is Sunday-first; rotate so Monday is column zero.
  const lead = (first.getUTCDay() + 6) % 7

  const days: { key: DateKey; inMonth: boolean }[] = []
  const start = new Date(first)
  start.setUTCDate(start.getUTCDate() - lead)

  // Six rows always, so the panel does not change height between months.
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + i)
    days.push({
      key: day.toISOString().slice(0, 10),
      inMonth: day.getUTCMonth() === index! - 1,
    })
  }
  return days
}

export type CalendarProps = {
  month: string
  onMonthChange: (month: string) => void
  /** Both ends set: a filled range. Only `from`: the half-made one. */
  from: DateKey | null
  to: DateKey | null
  onSelectDay: (key: DateKey) => void
  /** Today in the *restaurant's* timezone, marked but not selected. */
  today?: DateKey
  /** Days after this cannot be picked — a range that ends in the future is noise. */
  maxDate?: DateKey
}

export function Calendar({
  month,
  onMonthChange,
  from,
  to,
  onSelectDay,
  today,
  maxDate,
}: CalendarProps) {
  const theme = useTheme()
  const days = useMemo(() => monthGrid(month), [month])

  return (
    <View style={{ padding: theme.space.sm, gap: theme.space.xs }}>
      <Inline justify="space-between" align="center">
        <IconButton label="Previous month" onPress={() => onMonthChange(shiftMonth(month, -1))}>
          <Text color="muted">‹</Text>
        </IconButton>
        <Text variant="bodyStrong">{formatMonth(month)}</Text>
        <IconButton label="Next month" onPress={() => onMonthChange(shiftMonth(month, 1))}>
          <Text color="muted">›</Text>
        </IconButton>
      </Inline>

      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={{ width: CELL, alignItems: 'center' }}>
            <Text variant="caption" color="muted">
              {day.slice(0, 1)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: CELL * 7 }}>
        {days.map((day) => (
          <Day
            key={day.key}
            dayKey={day.key}
            inMonth={day.inMonth}
            isToday={day.key === today}
            disabled={maxDate !== undefined && day.key > maxDate}
            // An unfinished range highlights only its start, so it is obvious
            // the picker is waiting for a second date.
            edge={day.key === from || (to !== null && day.key === to)}
            between={from !== null && to !== null && day.key > from && day.key < to}
            onPress={() => onSelectDay(day.key)}
          />
        ))}
      </View>
    </View>
  )
}

function Day({
  dayKey,
  inMonth,
  isToday,
  edge,
  between,
  disabled,
  onPress,
}: {
  dayKey: DateKey
  inMonth: boolean
  isToday: boolean
  edge: boolean
  between: boolean
  disabled: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()

  const background = edge
    ? theme.color.brand.default
    : between
      ? theme.color.brand.subtle
      : state.hovered && !disabled
        ? theme.color.bg.inset
        : 'transparent'

  return (
    <Pressable
      role="button"
      aria-label={dayKey}
      aria-selected={edge || between}
      disabled={disabled}
      focusable={!disabled}
      {...handlers}
      onPress={onPress}
      style={{
        width: CELL,
        height: CELL,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.sm,
        backgroundColor: background,
        opacity: disabled ? 0.35 : inMonth ? 1 : 0.45,
        // Today reads as a ring rather than a fill, so it never looks selected.
        borderWidth: isToday && !edge ? theme.borderWidth.thin : 0,
        borderColor: theme.color.border.strong,
      }}
    >
      <Text variant={edge ? 'bodyStrong' : 'body'} color={edge ? 'onBrand' : 'primary'}>
        {String(Number(dayKey.slice(8)))}
      </Text>
    </Pressable>
  )
}
