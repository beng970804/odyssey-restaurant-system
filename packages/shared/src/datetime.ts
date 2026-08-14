export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type OpeningHours = Record<
  DayKey,
  { closed: true } | { closed?: false; open: string; close: string }
>

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Returns the weekday key and HH:mm for `date` as seen in `timeZone`.
 *
 * Intl.DateTimeFormat rather than a date library because it behaves identically
 * in Node, the browser and workerd, with no dependency.
 */
function localParts(date: Date, timeZone: string): { day: DayKey; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  const weekdayIndex = WEEKDAY_NAMES.indexOf(parts.weekday!)
  // hour12: false can render midnight as "24" in some ICU versions.
  const hour = Number(parts.hour === '24' ? '00' : parts.hour)
  return { day: DAY_KEYS[weekdayIndex]!, minutes: hour * 60 + Number(parts.minute) }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h! * 60 + m!
}

/**
 * A Worker's clock is UTC; a restaurant's hours are local. Getting this wrong
 * means the API refuses orders for eight hours a day and nobody notices until
 * a demo.
 */
export function isWithinOpeningHours(date: Date, hours: OpeningHours, timeZone: string): boolean {
  const { day, minutes } = localParts(date, timeZone)
  const today = hours[day]
  if (!today || today.closed) return false
  return minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)
}

export function addMinutes(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 60_000)
}

/**
 * How far `timeZone` runs ahead of UTC at this instant, in milliseconds.
 *
 * Formatting an instant into a zone and reading it back as if it were UTC gives
 * the offset by subtraction — the same Intl-only approach as `localParts`, so
 * DST comes from the same table the rest of the app trusts.
 */
function offsetMs(date: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const p = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    p.hour === '24' ? 0 : Number(p.hour),
    Number(p.minute),
    Number(p.second),
  )
  return asUtc - date.getTime()
}

/**
 * The instant a local calendar day (YYYY-MM-DD) begins in `timeZone`.
 *
 * A date filter is typed as a day, not an instant: "orders on 14 Aug" means the
 * restaurant's 14 Aug, not UTC's. Treating the key as UTC midnight shifts the
 * window by the offset — eight hours in Singapore, which quietly drops the
 * evening service off one end and adds someone else's off the other.
 *
 * Measured twice: the first offset is read at the wrong instant when the day
 * begins on a DST boundary, and the second is read at the answer.
 */
export function startOfLocalDay(dateKey: string, timeZone: string): Date {
  const utcMidnight = new Date(`${dateKey}T00:00:00.000Z`)
  const firstGuess = new Date(utcMidnight.getTime() - offsetMs(utcMidnight, timeZone))
  return new Date(utcMidnight.getTime() - offsetMs(firstGuess, timeZone))
}

/** The last instant of a local calendar day — an inclusive range's far end. */
export function endOfLocalDay(dateKey: string, timeZone: string): Date {
  const nextDay = new Date(`${dateKey}T00:00:00.000Z`)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return new Date(startOfLocalDay(nextDay.toISOString().slice(0, 10), timeZone).getTime() - 1)
}

/** The calendar date (YYYY-MM-DD) of `date` as seen in `timeZone`. en-CA formats as ISO. */
export function localDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
