import { unwrap, useGetStatsSummary } from '@repo/api-client'
import type { NavItemIcon, StatusTone } from '@repo/ui'
import IconCalculator from '@tabler/icons-react-native/IconCalculator'
import IconCash from '@tabler/icons-react-native/IconCash'
import IconReceipt from '@tabler/icons-react-native/IconReceipt'
import { useCurrency } from '../../hooks/useCurrency'
import { useTimezone } from '../../hooks/useTimezone'
import { countFigure, moneyFigure, type KpiFigure } from './kpiFigure'

export type Kpi = {
  label: string
  figure: KpiFigure
  icon?: NavItemIcon
  hint?: string
}

/** The wide card: a count, the share of the book it represents, and a way in. */
export type Pending = {
  count: number
  total: number
  caption: string
  tone: StatusTone
}

/**
 * The screen receives what to show, never how to derive it: no formatting and
 * no conditionals reach the components below. That is spec §10.1's layering
 * rule made concrete — screens compose, they do not compute.
 *
 * The one deliberate exception is the money boundary. A figure that counts up
 * has to be rendered on every frame, so the card calls `formatFigure` as it
 * climbs rather than being handed a finished string. `formatMoney` is still the
 * only place cents become dollars (ADR 0008).
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
          figure: countFigure(summary.totalOrders),
          hint: 'All time',
          icon: ({ color, size }) => <IconReceipt color={color} size={size} />,
        },
        {
          label: 'Revenue',
          figure: moneyFigure(summary.revenueCents),
          hint: 'Cancelled orders excluded',
          icon: ({ color, size }) => <IconCash color={color} size={size} />,
        },
        {
          label: 'Average order',
          figure: moneyFigure(summary.averageOrderValueCents),
          hint: 'Per earning order',
          icon: ({ color, size }) => <IconCalculator color={color} size={size} />,
        },
      ]
    : []

  // Pending is lifted out of the row because it is the only figure on the
  // screen anyone acts on. It gets the wide cell, the share of the book, and
  // the link into the queue (ADR 0008).
  const pending: Pending | undefined = summary && {
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
