import { createSelectSchema } from 'drizzle-zod'
import { z } from '@hono/zod-openapi'
import { SUPPORTED_CURRENCIES, SUPPORTED_TIMEZONES } from '@repo/types'
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
 * Every opening-hours comparison runs through Intl with this string. A closed
 * list rather than an "is it resolvable" probe: the probe let through every one
 * of the world's ~400 zones, and the restaurants only ever sit in two.
 */
const timezoneString = z.enum(SUPPORTED_TIMEZONES)

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
    // A closed list, not "any 3 letters": the value reaches Intl.NumberFormat
    // at every money call site, and "XXX" formats — as nonsense.
    currency: z.enum(SUPPORTED_CURRENCIES),
    timezone: timezoneString,
    openingHours: openingHoursSchema,
  })
  .partial()
  .openapi('UpdateSettings')
