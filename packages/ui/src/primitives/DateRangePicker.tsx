import { Inline } from './Inline'
import { Input } from './Input'
import { Text } from './Text'

export type DateRange = { from: string | null; to: string | null }

export type DateRangePickerProps = {
  value: DateRange
  onChange: (value: DateRange) => void
}

/**
 * Two ISO date fields rather than a calendar widget. The API takes ISO strings,
 * and a hand-rolled calendar is a week of work that this dashboard does not
 * need — the range filter is for "last week", typed once.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <Inline gap="sm">
      <Input
        value={value.from ?? ''}
        onChangeText={(from) => onChange({ ...value, from: from || null })}
        placeholder="YYYY-MM-DD"
        ariaLabel="From date"
      />
      <Text variant="caption" color="muted">
        to
      </Text>
      <Input
        value={value.to ?? ''}
        onChangeText={(to) => onChange({ ...value, to: to || null })}
        placeholder="YYYY-MM-DD"
        ariaLabel="To date"
      />
    </Inline>
  )
}
