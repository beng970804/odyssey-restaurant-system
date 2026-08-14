import { unwrap, useGetStatsSummary } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import type { NavItemIcon, StatusTone } from '@repo/ui'
import IconCalculator from '@tabler/icons-react-native/IconCalculator'
import IconCash from '@tabler/icons-react-native/IconCash'
import IconReceipt from '@tabler/icons-react-native/IconReceipt'
import { useCurrency } from '../../hooks/useCurrency'
import { useTimezone } from '../../hooks/useTimezone'

/**
 * The figure arrives as a number *and* the function that renders it, because a
 * card that counts up has to format every frame. `format` is the display
 * boundary — `formatMoney` divides by 100 inside it and nowhere else — so the
 * card still does no formatting of its own, it only calls what it was handed.
 */
export type Kpi = {
  label: string
  amount: number
  format: (amount: number) => string
  icon?: NavItemIcon
  hint?: string
}

/** The wide card: a count, the share of the book it represents, and a way in. */
export type Pending = {
  value: string
  count: number
  total: number
  caption: string
  tone: StatusTone
}

/**
 * The screen receives display-ready strings: it performs no formatting and no
 * conditionals. That is spec §10.1's layering rule made concrete — screens
 * compose, they do not compute.
 */
export function useHomeSummary() {
  const { data, isLoading, error, refetch } = useGetStatsSummary()
  const currency = useCurrency()
  const timezone = useTimezone()
  const summary = unwrap(data)

  const kpis: Kpi[] = summary
    ? [
        {
          label: 'Total orders',
          amount: summary.totalOrders,
          format: (amount) => String(Math.round(amount)),
          hint: 'All time',
          icon: ({ color, size }) => <IconReceipt color={color} size={size} />,
        },
        {
          label: 'Revenue',
          amount: summary.revenueCents,
          format: (cents) => formatMoney(Math.round(cents), currency),
          hint: 'Cancelled orders excluded',
          icon: ({ color, size }) => <IconCash color={color} size={size} />,
        },
        {
          label: 'Average order',
          amount: summary.averageOrderValueCents,
          format: (cents) => formatMoney(Math.round(cents), currency),
          hint: 'Per earning order',
          icon: ({ color, size }) => <IconCalculator color={color} size={size} />,
        },
      ]
    : []

  // Pending is lifted out of the row because it is the only figure on the
  // screen anyone acts on. It gets the wide cell, the share of the book, and
  // the link into Orders.
  const pending: Pending | undefined = summary && {
    value: String(summary.pendingOrders),
    count: summary.pendingOrders,
    total: summary.totalOrders,
    caption: `of ${summary.totalOrders} orders all time`,
    tone: summary.pendingOrders > 0 ? 'warning' : 'success',
  }

  return {
    isLoading,
    error: error as Error | null,
    refetch,
    kpis,
    pending,
    trend: summary?.dailyTrend ?? [],
    topItems: summary?.topItems ?? [],
    currency,
    timezone,
  }
}
