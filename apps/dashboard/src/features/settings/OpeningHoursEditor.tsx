import type { DayKey, OpeningHours } from '@repo/shared'
import { Inline, Input, Stack, Switch, Text } from '@repo/ui'

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
  return (
    <Stack gap="sm">
      {DAYS.map((day) => {
        const hours = value[day.key]
        // Narrowed once, so the open/close fields are only reachable on a day
        // that actually has them.
        const openHours = hours.closed ? null : hours

        return (
          <Inline key={day.key} gap="md" align="center">
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
                <Input
                  value={openHours.open}
                  ariaLabel={`${day.label} opening time`}
                  onChangeText={(open) => onChange({ ...value, [day.key]: { ...openHours, open } })}
                  placeholder="11:00"
                />
                <Text color="muted">to</Text>
                <Input
                  value={openHours.close}
                  ariaLabel={`${day.label} closing time`}
                  onChangeText={(close) =>
                    onChange({ ...value, [day.key]: { ...openHours, close } })
                  }
                  placeholder="22:00"
                />
              </Inline>
            )}
          </Inline>
        )
      })}
    </Stack>
  )
}
