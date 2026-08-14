import type { DayKey, OpeningHours } from '@repo/shared'
import { Inline, Input, Stack, Switch, Text, useBreakpoint } from '@repo/ui'
import { View } from 'react-native'

/**
 * A time is five characters, so the field takes a five-character width. Left
 * free, the two inputs took ~150px each and the row ran to ~500px — off the
 * right edge of a phone, with the closing time clipped and unreachable.
 */
const TIME_FIELD_WIDTH = 90

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

export function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: OpeningHours
  onChange: (next: OpeningHours) => void
}) {
  const { isCompact } = useBreakpoint()

  return (
    // Wrapped, a day is two lines with a 12px gap inside it — so the 8px
    // between days put a day's times nearer the *next* day's label than its
    // own. Compact widens the between-days gap past the within-day one, which
    // is what makes the grouping legible again.
    <Stack gap={isCompact ? 'xl' : 'sm'}>
      {DAYS.map((day) => {
        const hours = value[day.key]
        // Narrowed once, so the open/close fields are only reachable on a day
        // that actually has them.
        const openHours = hours.closed ? null : hours

        return (
          // Wrapping is what keeps the row on a phone: the time pair drops to
          // its own line under the label instead of running off the edge.
          <Inline key={day.key} gap="md" align="center" wrap>
            <Text style={{ width: 110 }}>{day.label}</Text>
            <Switch
              value={openHours !== null}
              label={`${day.label} open`}
              onValueChange={(open) =>
                onChange({
                  ...value,
                  [day.key]: open ? { open: '11:00', close: '22:00' } : { closed: true },
                })
              }
            />
            {openHours === null ? (
              <Text color="muted">Closed</Text>
            ) : (
              <Inline gap="sm">
                <View style={{ width: TIME_FIELD_WIDTH }}>
                  <Input
                    value={openHours.open}
                    ariaLabel={`${day.label} opening time`}
                    onChangeText={(open) =>
                      onChange({ ...value, [day.key]: { ...openHours, open } })
                    }
                    placeholder="11:00"
                  />
                </View>
                <Text color="muted">to</Text>
                <View style={{ width: TIME_FIELD_WIDTH }}>
                  <Input
                    value={openHours.close}
                    ariaLabel={`${day.label} closing time`}
                    onChangeText={(close) =>
                      onChange({ ...value, [day.key]: { ...openHours, close } })
                    }
                    placeholder="22:00"
                  />
                </View>
              </Inline>
            )}
          </Inline>
        )
      })}
    </Stack>
  )
}
