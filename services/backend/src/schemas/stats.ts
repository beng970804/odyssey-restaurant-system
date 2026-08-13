import { z } from '@hono/zod-openapi'

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
    dailyTrend: z.array(
      z.object({
        /** A calendar date in the settings timezone, not UTC. */
        date: z.string(),
        orderCount: z.number().int(),
        revenueCents: z.number().int(),
      }),
    ),
  })
  .openapi('StatsSummary')
