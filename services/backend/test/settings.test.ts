import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seed } from '../src/db/seed'

let db: TestDb
let cleanup: () => Promise<void>
let app: ReturnType<typeof createTestApp>

beforeAll(async () => {
  ;({ db, cleanup } = await createTestDb())
  await seed(db)
  app = createTestApp(db)
})

afterAll(async () => {
  await cleanup()
})

type DayHours = { closed: true } | { closed?: false; open: string; close: string }
type Settings = {
  id: number
  taxRatePercent: number
  currency: string
  timezone: string
  deliveryFeeCents: number
  defaultPrepTimeMinutes: number
  dineInEnabled: boolean
  openingHours: Record<string, DayHours>
  updatedAt: string
}

const openingHours: Record<string, DayHours> = {
  mon: { open: '11:00', close: '22:00' },
  tue: { open: '11:00', close: '22:00' },
  wed: { open: '11:00', close: '22:00' },
  thu: { open: '11:00', close: '22:00' },
  fri: { open: '11:00', close: '23:00' },
  sat: { open: '11:00', close: '23:00' },
  sun: { closed: true },
}

const patch = (body: unknown) =>
  app.request('/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

const getSettings = async (): Promise<Settings> => {
  const res = await app.request('/settings')
  expect(res.status).toBe(200)
  return (await res.json()) as Settings
}

const errorCode = async (res: Response) =>
  ((await res.json()) as { error: { code: string } }).error.code

describe('reading settings', () => {
  it('returns the singleton row', async () => {
    const body = await getSettings()
    expect(body.id).toBe(1)
    expect(body.currency).toBe('SGD')
    expect(body.taxRatePercent).toBe(9)
    expect(body.timezone).toBe('Asia/Singapore')
  })

  it('returns opening hours as structured days, not an opaque blob', async () => {
    const body = await getSettings()
    expect(Object.keys(body.openingHours).toSorted()).toEqual([
      'fri',
      'mon',
      'sat',
      'sun',
      'thu',
      'tue',
      'wed',
    ])
    expect(body.openingHours.sun).toEqual({ closed: true })
    expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('updating settings', () => {
  it('persists a partial update and bumps updatedAt', async () => {
    const before = await getSettings()

    const res = await patch({ defaultPrepTimeMinutes: 35, autoAcceptOrders: true })
    expect(res.status).toBe(200)

    const updated = (await res.json()) as Settings
    expect(updated.defaultPrepTimeMinutes).toBe(35)
    // Untouched fields survive a PATCH.
    expect(updated.currency).toBe(before.currency)
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before.updatedAt))

    expect((await getSettings()).defaultPrepTimeMinutes).toBe(35)
  })

  it('replaces opening hours wholesale', async () => {
    const res = await patch({ openingHours: { ...openingHours, mon: { closed: true } } })
    expect(res.status).toBe(200)
    expect((await getSettings()).openingHours.mon).toEqual({ closed: true })

    await patch({ openingHours })
  })

  it('rejects a tax rate above 100', async () => {
    const res = await patch({ taxRatePercent: 150 })
    expect(res.status).toBe(422)
    expect(await errorCode(res)).toBe('VALIDATION_FAILED')
  })

  it('rejects a negative tax rate', async () => {
    expect((await patch({ taxRatePercent: -1 })).status).toBe(422)
  })

  it('rejects a negative delivery fee', async () => {
    expect((await patch({ deliveryFeeCents: -100 })).status).toBe(422)
  })

  it('rejects opening hours with a malformed time', async () => {
    const res = await patch({ openingHours: { mon: { open: '25:00', close: '22:00' } } })
    expect(res.status).toBe(422)
    expect(await errorCode(res)).toBe('VALIDATION_FAILED')
  })

  it('rejects a day whose closing time precedes its opening time', async () => {
    const res = await patch({
      openingHours: { ...openingHours, tue: { open: '22:00', close: '11:00' } },
    })
    expect(res.status).toBe(422)
  })

  it('rejects opening hours missing a day', async () => {
    const { sun: _sun, ...missingSunday } = openingHours
    expect((await patch({ openingHours: missingSunday })).status).toBe(422)
  })

  it('rejects a timezone the runtime cannot resolve', async () => {
    // The opening-hours rule is only as good as this field: an unresolvable
    // zone would throw inside Intl on every order placed.
    const res = await patch({ timezone: 'Mars/Olympus_Mons' })
    expect(res.status).toBe(422)
  })

  it('leaves the singleton alone — id is not writable', async () => {
    await patch({ id: 2 })
    expect((await getSettings()).id).toBe(1)
  })
})
