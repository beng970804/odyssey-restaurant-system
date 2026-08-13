import { createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { settings } from '../db/schema'
import { isoDateTime } from './common'

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm')
  .openapi({ example: '11:00' })

const dayHoursSchema = z.union([
  z.object({ closed: z.literal(true) }),
  z
    .object({ closed: z.literal(false).optional(), open: timeString, close: timeString })
    .refine((d) => d.open < d.close, { message: 'Opening time must be before closing time' }),
])

/**
 * Hand-written because it validates the *inside* of a jsonb column, which
 * drizzle-zod can only type as `unknown` — on responses as well as requests.
 * Every day is required: a partial week would leave `isWithinOpeningHours`
 * silently treating the missing days as closed.
 */
export const openingHoursSchema = z
  .object({
    mon: dayHoursSchema,
    tue: dayHoursSchema,
    wed: dayHoursSchema,
    thu: dayHoursSchema,
    fri: dayHoursSchema,
    sat: dayHoursSchema,
    sun: dayHoursSchema,
  })
  .openapi('OpeningHours')

/**
 * Every opening-hours comparison runs through Intl with this string. A zone the
 * runtime cannot resolve throws on every order placed, so it is rejected at the
 * boundary rather than discovered in production.
 */
const timezoneString = z.string().refine(
  (tz) => {
    try {
      // Called without `new` — it constructs either way, and this is a probe
      // for the RangeError an unresolvable zone throws, not a formatter we keep.
      Intl.DateTimeFormat('en-US', { timeZone: tz })
      return true
    } catch {
      return false
    }
  },
  { message: 'Expected an IANA timezone, e.g. Asia/Singapore' },
)

export const settingsSchema = createSelectSchema(settings, {
  openingHours: openingHoursSchema,
  updatedAt: isoDateTime,
}).openapi('Settings')

/**
 * `id` and `updatedAt` are deliberately absent: the row is a singleton the
 * database pins to id = 1, and the timestamp is the server's to set.
 */
export const updateSettingsSchema = z
  .object({
    defaultPrepTimeMinutes: z.number().int().positive(),
    autoAcceptOrders: z.boolean(),
    dineInEnabled: z.boolean(),
    takeawayEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    deliveryFeeCents: z.number().int().nonnegative(),
    taxRatePercent: z.number().int().min(0).max(100),
    currency: z.string().length(3),
    timezone: timezoneString,
    openingHours: openingHoursSchema,
  })
  .partial()
  .openapi('UpdateSettings')
