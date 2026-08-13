import { z } from '@hono/zod-openapi'

/**
 * One rule throughout: an order counts toward *counts* whatever its status, but
 * only a non-cancelled order contributes *money*.
 */
export const statsSummarySchema = z
  .object({
    totalOrders: z.number().int(),
    revenueCents: z.number().int(),
    pendingOrders: z.number().int(),
    averageOrderValueCents: z.number().int(),
    topItems: z.array(
      z.object({
        menuItemId: z.uuid(),
        name: z.string(),
        quantitySold: z.number().int(),
      }),
    ),
    /**
     * One entry per day, including days with no orders, so the chart has no
     * gaps. The same rule holds here as above: counts include cancelled
     * orders, money never does.
     */
    dailyTrend: z.array(
      z.object({
        /** A calendar date in the settings timezone, not UTC. */
        date: z.string(),
        /** Every order placed that day, cancellations included. */
        orderCount: z.number().int(),
        /** Cancelled orders contribute nothing. */
        revenueCents: z.number().int(),
      }),
    ),
  })
  .openapi('StatsSummary')
