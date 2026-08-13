import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ORDER_STATUSES } from '@repo/types'
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

type OrderRow = {
  id: string
  orderNumber: number
  status: string
  channel: string
  totalCents: number
  placedAt: string
  customerId: string | null
  customerName: string | null
  itemCount: number
}
type OrderList = {
  data: OrderRow[]
  meta: { total: number; page: number; pageSize: number }
}

const list = async (query = ''): Promise<OrderList> => {
  const res = await app.request(`/orders${query}`)
  expect(res.status).toBe(200)
  return (await res.json()) as OrderList
}

describe('order list', () => {
  it('returns orders newest first, with a page of the default size', async () => {
    const body = await list()
    expect(body.meta.total).toBe(60)
    expect(body.meta.page).toBe(1)
    expect(body.data).toHaveLength(body.meta.pageSize)

    const placed = body.data.map((o) => Date.parse(o.placedAt))
    expect(placed).toEqual(placed.toSorted((a, b) => b - a))
  })

  it('carries the customer name and item count so the table needs no second fetch', async () => {
    const body = await list('?pageSize=100')

    const withCustomer = body.data.find((o) => o.customerId !== null)!
    expect(withCustomer.customerName).toBeTruthy()

    // ~20% of seeded orders are walk-ins: no customer, but still a row.
    const walkIn = body.data.find((o) => o.customerId === null)!
    expect(walkIn.customerName).toBeNull()

    expect(body.data.every((o) => o.itemCount >= 1)).toBe(true)
  })

  it('filters by status', async () => {
    for (const status of ORDER_STATUSES) {
      const body = await list(`?status=${status}`)
      expect(body.data.every((o) => o.status === status)).toBe(true)
      expect(body.meta.total).toBeGreaterThan(0)
    }
  })

  it('filters by channel', async () => {
    const body = await list('?channel=delivery')
    expect(body.data.every((o) => o.channel === 'delivery')).toBe(true)
    expect(body.meta.total).toBeGreaterThan(0)
  })

  it('combines filters', async () => {
    const body = await list('?status=completed&channel=takeaway')
    expect(body.data.every((o) => o.status === 'completed' && o.channel === 'takeaway')).toBe(true)
  })

  it('filters by date range', async () => {
    const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const body = await list(`?from=${from.toISOString()}&pageSize=100`)

    expect(body.meta.total).toBeGreaterThan(0)
    expect(body.meta.total).toBeLessThan(60)
    for (const order of body.data) {
      expect(Date.parse(order.placedAt)).toBeGreaterThanOrEqual(from.getTime())
    }
  })

  it('honours both ends of a date range', async () => {
    const to = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const body = await list(`?to=${to.toISOString()}&pageSize=100`)
    for (const order of body.data) {
      expect(Date.parse(order.placedAt)).toBeLessThanOrEqual(to.getTime())
    }
  })

  it('searches by order number', async () => {
    const all = await list()
    const target = all.data[0]!

    const body = await list(`?search=${target.orderNumber}`)
    expect(body.data[0]!.id).toBe(target.id)
    expect(body.meta.total).toBe(1)
  })

  it('searches by customer name, case-insensitively', async () => {
    const all = await list('?pageSize=100')
    const target = all.data.find((o) => o.customerName !== null)!

    const body = await list(`?search=${encodeURIComponent(target.customerName!.toLowerCase())}`)
    expect(body.meta.total).toBeGreaterThan(0)
    expect(body.data.every((o) => o.customerName === target.customerName)).toBe(true)
  })

  it('paginates with an accurate total', async () => {
    const first = await list('?page=1&pageSize=5')
    expect(first.data).toHaveLength(5)
    expect(first.meta.total).toBe(60)

    const second = await list('?page=2&pageSize=5')
    expect(second.data).toHaveLength(5)
    // A page is a window on one ordering, not a fresh sample.
    expect(second.data.map((o) => o.id)).not.toEqual(first.data.map((o) => o.id))
  })

  it('returns an empty page past the end rather than failing', async () => {
    const body = await list('?page=99&pageSize=25')
    expect(body.data).toEqual([])
    expect(body.meta.total).toBe(60)
  })

  it('caps the page size', async () => {
    expect((await app.request('/orders?pageSize=1000')).status).toBe(422)
  })

  it('rejects an unknown status filter', async () => {
    expect((await app.request('/orders?status=elsewhere')).status).toBe(422)
  })

  it('returns full detail including items and customer', async () => {
    const all = await list('?pageSize=100')
    const target = all.data.find((o) => o.customerId !== null)!

    const res = await app.request(`/orders/${target.id}`)
    expect(res.status).toBe(200)

    const order = (await res.json()) as {
      items: { nameSnapshot: string; unitPriceCents: number }[]
      customer: { name: string } | null
    }
    expect(order.items.length).toBeGreaterThan(0)
    expect(order.items[0]).toHaveProperty('nameSnapshot')
    expect(order.customer?.name).toBeTruthy()
  })

  it('404s an order that does not exist', async () => {
    const res = await app.request('/orders/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
