import { describe, expect, it } from 'vitest'
import { endOfLocalDay, isWithinOpeningHours, localDateKey, startOfLocalDay } from '../src/datetime'
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

describe('startOfLocalDay / endOfLocalDay', () => {
  it('starts a Singapore day eight hours before UTC midnight', () => {
    expect(startOfLocalDay('2026-08-14', 'Asia/Singapore').toISOString()).toBe(
      '2026-08-13T16:00:00.000Z',
    )
  })

  it('ends a Singapore day on its last millisecond', () => {
    expect(endOfLocalDay('2026-08-14', 'Asia/Singapore').toISOString()).toBe(
      '2026-08-14T15:59:59.999Z',
    )
  })

  it('spans exactly one day, so a single-day filter is that whole service', () => {
    const span =
      endOfLocalDay('2026-08-14', 'Asia/Singapore').getTime() -
      startOfLocalDay('2026-08-14', 'Asia/Singapore').getTime()
    expect(span).toBe(24 * 60 * 60 * 1000 - 1)
  })

  it('agrees with UTC in a zone that has no offset', () => {
    expect(startOfLocalDay('2026-08-14', 'UTC').toISOString()).toBe('2026-08-14T00:00:00.000Z')
  })

  it('follows the offset across a DST boundary', () => {
    // New York is UTC-5 in January and UTC-4 in July.
    expect(startOfLocalDay('2026-01-15', 'America/New_York').toISOString()).toBe(
      '2026-01-15T05:00:00.000Z',
    )
    expect(startOfLocalDay('2026-07-15', 'America/New_York').toISOString()).toBe(
      '2026-07-15T04:00:00.000Z',
    )
  })

  it('handles the short day itself — the one the second measurement is for', () => {
    // 2026-03-08 is the US spring-forward: the day starts at 00:00 EST and
    // loses an hour at 02:00.
    expect(startOfLocalDay('2026-03-08', 'America/New_York').toISOString()).toBe(
      '2026-03-08T05:00:00.000Z',
    )
    const span =
      endOfLocalDay('2026-03-08', 'America/New_York').getTime() -
      startOfLocalDay('2026-03-08', 'America/New_York').getTime()
    expect(span).toBe(23 * 60 * 60 * 1000 - 1)
  })
})
