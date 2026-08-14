import { ORDER_CHANNELS, ORDER_STATUS_LABELS, ORDER_STATUSES } from '@repo/types'
import { Badge, Button, Card, DateRangePicker, Inline, SearchInput, Select } from '@repo/ui'
import { View } from 'react-native'
import { CHANNEL_LABELS } from './formatting'
import type { useOrderFilters } from './useOrderFilters'

const STATUS_OPTIONS = ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }))
const CHANNEL_OPTIONS = ORDER_CHANNELS.map((value) => ({
  value,
  label: CHANNEL_LABELS[value] ?? value,
}))

export function OrderFilterBar({ filters }: { filters: ReturnType<typeof useOrderFilters> }) {
  return (
    <Card padding="md">
      <Inline gap="md" wrap align="center">
        {/* Wide enough for its own placeholder — cut off, the field reads as
            order-number-only and nobody discovers customer search. */}
        <View style={{ minWidth: 280 }}>
          <SearchInput
            value={filters.searchInput}
            onChangeText={filters.setSearch}
            placeholder="Order number or customer"
          />
        </View>
        <Select
          options={STATUS_OPTIONS}
          value={filters.status ?? null}
          onChange={filters.setStatus}
          onClear={() => filters.setStatus(undefined)}
          placeholder="Any status"
        />
        <Select
          options={CHANNEL_OPTIONS}
          value={filters.channel ?? null}
          onChange={filters.setChannel}
          onClear={() => filters.setChannel(undefined)}
          placeholder="Any channel"
        />
        <DateRangePicker
          value={{ from: filters.from ?? null, to: filters.to ?? null }}
          today={filters.today}
          onChange={(range) => filters.setRange(range.from ?? undefined, range.to ?? undefined)}
        />
        {filters.activeCount > 0 ? (
          <Inline gap="sm">
            {/* Centred against the taller "Clear all" beside it, rather than
                riding the top of the row on the Badge's default alignment. */}
            <Badge tone="info" style={{ alignSelf: 'center' }}>
              {`${filters.activeCount} active`}
            </Badge>
            <Button variant="ghost" size="sm" onPress={filters.clearAll}>
              Clear all
            </Button>
          </Inline>
        ) : null}
      </Inline>
    </Card>
  )
}
