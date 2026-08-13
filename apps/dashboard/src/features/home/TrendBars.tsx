import { Card, Inline, Stack, Text, useTheme } from '@repo/ui'
import { formatMoney } from '@repo/shared'
import { View } from 'react-native'

export type TrendDay = { date: string; orderCount: number; revenueCents: number }

const CHART_HEIGHT = 140

/**
 * Bars sized as a percentage of the busiest day, built from tokens rather than
 * a charting library: seven values do not justify the dependency, and the
 * colours have to come from the theme to survive a mode switch.
 */
export function TrendBars({ days, currency }: { days: TrendDay[]; currency: string }) {
  const theme = useTheme()
  const peak = Math.max(1, ...days.map((day) => day.revenueCents))

  return (
    <Card padding="lg">
      <Stack gap="md">
        <Stack gap="xs">
          <Text variant="h3">Last seven days</Text>
          <Text variant="caption" color="muted">
            Revenue by day, in the restaurant&apos;s timezone
          </Text>
        </Stack>

        <Inline gap="sm" align="flex-end" style={{ height: CHART_HEIGHT }}>
          {days.map((day) => (
            <Stack key={day.date} gap="xs" flex={1} align="center" justify="flex-end">
              <Text variant="caption" color="muted">
                {day.orderCount > 0 ? formatMoney(day.revenueCents, currency) : ''}
              </Text>
              <View
                accessibilityLabel={`${day.date}: ${day.orderCount} orders`}
                style={{
                  width: '100%',
                  height: Math.max(2, (day.revenueCents / peak) * (CHART_HEIGHT - 40)),
                  borderRadius: theme.radius.sm,
                  backgroundColor:
                    day.revenueCents > 0 ? theme.color.brand.default : theme.color.border.default,
                }}
              />
              <Text variant="caption" color="muted">
                {day.date.slice(5)}
              </Text>
            </Stack>
          ))}
        </Inline>
      </Stack>
    </Card>
  )
}
