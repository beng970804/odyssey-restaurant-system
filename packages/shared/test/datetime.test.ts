import { describe, expect, it } from 'vitest'
import { isWithinOpeningHours, localDateKey } from '../src/datetime'
import type { OpeningHours } from '../src/datetime'

const hours: OpeningHours = {
  mon: { open: '11:00', close: '22:00' },
  tue: { open: '11:00', close: '22:00' },
  wed: { open: '11:00', close: '22:00' },
  thu: { open: '11:00', close: '22:00' },
  fri: { open: '11:00', close: '23:00' },
  sat: { open: '11:00', close: '23:00' },
  sun: { closed: true },
}

describe('isWithinOpeningHours', () => {
  it('accepts a time inside the window, in the restaurant timezone', () => {
    // 2026-08-13 is a Thursday. 06:00 UTC = 14:00 in Singapore.
    expect(isWithinOpeningHours(new Date('2026-08-13T06:00:00Z'), hours, 'Asia/Singapore')).toBe(
      true,
    )
  })
  it('rejects a time before opening', () => {
    // 01:00 UTC = 09:00 Singapore, before the 11:00 open
    expect(isWithinOpeningHours(new Date('2026-08-13T01:00:00Z'), hours, 'Asia/Singapore')).toBe(
      false,
    )
  })
  it('rejects a closed day', () => {
    // 2026-08-16 is a Sunday
    expect(isWithinOpeningHours(new Date('2026-08-16T06:00:00Z'), hours, 'Asia/Singapore')).toBe(
      false,
    )
  })
})

describe('localDateKey', () => {
  it('buckets a late-UTC instant into the next Singapore day', () => {
    // 17:00 UTC on the 12th is 01:00 on the 13th in Singapore.
    expect(localDateKey(new Date('2026-08-12T17:00:00Z'), 'Asia/Singapore')).toBe('2026-08-13')
  })
  it('agrees with UTC when the instant is mid-day', () => {
    expect(localDateKey(new Date('2026-08-13T06:00:00Z'), 'Asia/Singapore')).toBe('2026-08-13')
  })
})
