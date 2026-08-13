import { unwrap, useGetStatsSummary } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import type { StatusTone } from '@repo/ui'
import { useCurrency } from '../../hooks/useCurrency'
import { useTimezone } from '../../hooks/useTimezone'

export type Kpi = { label: string; value: string; tone?: StatusTone; hint?: string }

/**
 * The screen receives display-ready strings: it performs no formatting and no
 * conditionals. That is spec §10.1's layering rule made concrete — screens
 * compose, they do not compute.
 */
export function useHomeSummary() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useGetStatsSummary()
  const currency = useCurrency()
  const timezone = useTimezone()
  const summary = unwrap(data)

  const kpis: Kpi[] = summary
    ? [
        { label: 'Total orders', value: String(summary.totalOrders), hint: 'All time' },
        {
          label: 'Revenue',
          value: formatMoney(summary.revenueCents, currency),
          hint: 'Cancelled orders excluded',
        },
        {
          label: 'Pending',
          value: String(summary.pendingOrders),
          tone: summary.pendingOrders > 0 ? 'warning' : undefined,
          hint: 'Awaiting a decision',
        },
        {
          label: 'Average order',
          value: formatMoney(summary.averageOrderValueCents, currency),
          hint: 'Per earning order',
        },
      ]
    : []

  return {
    isLoading,
    error: error as Error | null,
    refetch,
    kpis,
    trend: summary?.dailyTrend ?? [],
    topItems: summary?.topItems ?? [],
    currency,
    timezone,
    // When the board last heard from the server — 0 until the first fetch lands.
    updatedAt: dataUpdatedAt,
  }
}
