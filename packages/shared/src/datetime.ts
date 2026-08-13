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

/** The calendar date (YYYY-MM-DD) of `date` as seen in `timeZone`. en-CA formats as ISO. */
export function localDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
