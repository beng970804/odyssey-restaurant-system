import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedMinimal } from './helpers/fixtures'

// Thursday 14:00 in Singapore — inside the fixture's opening hours.
const NOW = new Date('2026-08-13T06:00:00Z')

type OrderItem = {
  menuItemId: string
  nameSnapshot: string
  unitPriceCents: number
  quantity: number
}
type Order = {
  id: string
  orderNumber: number
  status: string
  channel: string
  subtotalCents: number
  taxCents: number
  deliveryFeeCents: number
  totalCents: number
  estimatedReadyAt: string | null
  placedAt: string
  items: OrderItem[]
  customer: { id: string; name: string } | null
}
type ErrorBody = { error: { code: string; details?: { unavailableItems?: { name: string }[] } } }

describe('POST /orders', () => {
  let app: ReturnType<typeof createTestApp>
  let cleanup: () => Promise<void>
  let fixtures: Awaited<ReturnType<typeof seedMinimal>>

  beforeEach(async () => {
    // toFake: ['Date'] fakes ONLY the clock. Faking all timers stalls PGlite,
    // whose async machinery awaits real setTimeout/setImmediate.
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
    fixtures = await seedMinimal(testDb.db)
    app = createTestApp(testDb.db)
  })

  afterEach(async () => {
    vi.useRealTimers()
    await cleanup()
  })

  const post = (body: unknown) =>
    app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  const postOk = async (body: unknown): Promise<Order> => {
    const res = await post(body)
    expect(res.status).toBe(201)
    return (await res.json()) as Order
  }

  it('computes subtotal, tax and total server-side (spec §5.3)', async () => {
    const order = await postOk({
      channel: 'delivery',
      items: [
        { menuItemId: fixtures.nasiLemak.id, quantity: 2 },
        { menuItemId: fixtures.tehTarik.id, quantity: 1 },
      ],
    })
    expect(order.subtotalCents).toBe(2020)
    // Tax is on the subtotal only, never on the delivery fee.
    expect(order.taxCents).toBe(182)
    expect(order.deliveryFeeCents).toBe(400)
    expect(order.totalCents).toBe(2602)
  })

  it('ignores prices supplied by the client', async () => {
    const order = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.nasiLemak.id, quantity: 1, unitPriceCents: 1, totalCents: 1 }],
    })
    expect(order.subtotalCents).toBe(850)
    expect(order.items[0]!.unitPriceCents).toBe(850)
  })

  it('charges no delivery fee for non-delivery channels', async () => {
    const order = await postOk({
      channel: 'dine_in',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.deliveryFeeCents).toBe(0)
    expect(order.totalCents).toBe(320 + 29)
  })

  it('attaches a customer when one is given', async () => {
    const order = await postOk({
      channel: 'takeaway',
      customerId: fixtures.customer.id,
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.customer?.name).toBe('Aisyah Rahman')
  })

  it('accepts a walk-in with no customer', async () => {
    const order = await postOk({
      channel: 'dine_in',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.customer).toBeNull()
  })

  it('rejects an unavailable menu item, naming it', async () => {
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.soldOut.id, quantity: 1 }],
    })
    expect(res.status).toBe(422)

    const body = (await res.json()) as ErrorBody
    expect(body.error.code).toBe('ITEM_UNAVAILABLE')
    // Named, so the UI can highlight the offending line rather than showing a
    // generic failure.
    expect(body.error.details?.unavailableItems?.[0]!.name).toBe(fixtures.soldOut.name)
  })

  it('404s a customer that does not exist rather than failing the insert', async () => {
    // A stale client id must be a pipeline outcome, not a foreign-key violation
    // surfacing through the catch-all as a 500.
    const res = await post({
      channel: 'takeaway',
      customerId: '00000000-0000-0000-0000-000000000000',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as ErrorBody).error.code).toBe('NOT_FOUND')
  })

  it('404s a menu item that does not exist', async () => {
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as ErrorBody).error.code).toBe('NOT_FOUND')
  })

  it('rejects a disabled channel', async () => {
    await fixtures.setSettings({ deliveryEnabled: false })
    const res = await post({
      channel: 'delivery',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as ErrorBody).error.code).toBe('CHANNEL_DISABLED')
  })

  it('rejects an order placed outside opening hours', async () => {
    vi.setSystemTime(new Date('2026-08-13T01:00:00Z')) // 09:00 Singapore, opens 11:00
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as ErrorBody).error.code).toBe('OUTSIDE_OPENING_HOURS')
  })

  it('rejects an order placed on a closed day', async () => {
    vi.setSystemTime(new Date('2026-08-16T06:00:00Z')) // Sunday
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as ErrorBody).error.code).toBe('OUTSIDE_OPENING_HOURS')
  })

  it('honours auto-accept', async () => {
    await fixtures.setSettings({ autoAcceptOrders: true })
    const order = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.status).toBe('accepted')
  })

  it('defaults to pending when auto-accept is off', async () => {
    const order = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.status).toBe('pending')
  })

  it('sets estimated ready time from the prep-time setting', async () => {
    await fixtures.setSettings({ defaultPrepTimeMinutes: 25 })
    const order = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(order.estimatedReadyAt).toBe(new Date(NOW.getTime() + 25 * 60_000).toISOString())
  })

  it('freezes the item name and price (ADR 0001)', async () => {
    const created = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.nasiLemak.id, quantity: 1 }],
    })

    await fixtures.setMenuItemPrice(fixtures.nasiLemak.id, 1200)

    const refetched = (await (await app.request(`/orders/${created.id}`)).json()) as Order
    expect(refetched.items[0]!.unitPriceCents).toBe(850)
    expect(refetched.items[0]!.nameSnapshot).toBe('Nasi Lemak')
    expect(refetched.totalCents).toBe(created.totalCents)
  })

  it('numbers orders sequentially', async () => {
    const first = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    const second = await postOk({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(second.orderNumber).toBe(first.orderNumber + 1)
  })

  it('rejects an empty item list', async () => {
    const res = await post({ channel: 'takeaway', items: [] })
    expect(res.status).toBe(422)
  })

  it('rejects a zero quantity', async () => {
    const res = await post({
      channel: 'takeaway',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 0 }],
    })
    expect(res.status).toBe(422)
  })

  it('rejects an unknown channel', async () => {
    const res = await post({
      channel: 'drone',
      items: [{ menuItemId: fixtures.tehTarik.id, quantity: 1 }],
    })
    expect(res.status).toBe(422)
  })

  it('writes nothing when an item is unavailable (atomicity)', async () => {
    const countOrders = async () => {
      const body = (await (await app.request('/orders')).json()) as { meta: { total: number } }
      return body.meta.total
    }
    const before = await countOrders()

    await post({
      channel: 'takeaway',
      items: [
        { menuItemId: fixtures.nasiLemak.id, quantity: 1 },
        { menuItemId: fixtures.soldOut.id, quantity: 1 },
      ],
    })

    expect(await countOrders()).toBe(before)
  })
})
