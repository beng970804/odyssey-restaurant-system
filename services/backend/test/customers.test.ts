import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { jsonRequest } from './helpers/request'
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

const json = (path: string, method: string, body: unknown) => jsonRequest(app)(path, method, body)

type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
  orderCount: number
  lifetimeSpendCents: number
}
type OrderSummary = { id: string; status: string; totalCents: number; placedAt: string }
type CustomerDetail = Customer & { recentOrders: OrderSummary[] }

const listCustomers = async (
  query = '',
): Promise<{ data: Customer[]; meta: { total: number } }> => {
  const res = await app.request(`/customers${query}`)
  expect(res.status).toBe(200)
  return (await res.json()) as { data: Customer[]; meta: { total: number } }
}

describe('customer list', () => {
  it('returns every seeded customer with aggregates attached', async () => {
    const list = await listCustomers()
    expect(list.meta.total).toBe(list.data.length)
    expect(list.data.length).toBeGreaterThan(0)

    // The bigint cast: count()/sum() arrive as strings without ::int, and every
    // downstream calculation would silently concatenate.
    expect(list.data.every((c) => typeof c.orderCount === 'number')).toBe(true)
    expect(list.data.every((c) => typeof c.lifetimeSpendCents === 'number')).toBe(true)
    expect(list.data[0]!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('sorts by lifetime spend, highest first', async () => {
    const list = await listCustomers()
    const spends = list.data.map((c) => c.lifetimeSpendCents)
    expect(spends).toEqual(spends.toSorted((a, b) => b - a))
  })

  it('reports zero rather than null for a customer with no orders', async () => {
    const created = (await (
      await json('/customers', 'POST', { name: 'Never Ordered' })
    ).json()) as Customer

    const list = await listCustomers()
    const found = list.data.find((c) => c.id === created.id)
    expect(found?.orderCount).toBe(0)
    expect(found?.lifetimeSpendCents).toBe(0)
  })

  it('filters by name search, case-insensitively', async () => {
    const all = await listCustomers()
    const target = all.data.find((c) => c.orderCount > 0)!
    const list = await listCustomers(`?search=${encodeURIComponent(target.name.toLowerCase())}`)
    expect(list.data.map((c) => c.id)).toContain(target.id)
    expect(list.data.length).toBeLessThan(all.data.length)
  })

  it('computes lifetime spend excluding cancelled orders', async () => {
    const all = await listCustomers()
    const withOrders = all.data.find((c) => c.orderCount > 0)!
    expect(withOrders.lifetimeSpendCents).toBeGreaterThan(0)

    const detail = (await (
      await app.request(`/customers/${withOrders.id}`)
    ).json()) as CustomerDetail
    const expected = detail.recentOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalCents, 0)
    expect(withOrders.lifetimeSpendCents).toBeGreaterThanOrEqual(expected)
  })

  it('excludes cancelled orders from spend but not from the order count', async () => {
    const all = await listCustomers()

    // Find a customer whose history actually contains a cancellation, then
    // prove the two aggregates disagree in exactly the expected direction.
    for (const customer of all.data) {
      const detail = (await (
        await app.request(`/customers/${customer.id}`)
      ).json()) as CustomerDetail
      const cancelled = detail.recentOrders.filter((o) => o.status === 'cancelled')
      if (cancelled.length === 0 || detail.recentOrders.length !== customer.orderCount) continue

      const everything = detail.recentOrders.reduce((sum, o) => sum + o.totalCents, 0)
      expect(customer.lifetimeSpendCents).toBe(
        everything - cancelled.reduce((sum, o) => sum + o.totalCents, 0),
      )
      return
    }
    throw new Error('seed produced no customer with a cancelled order to check')
  })
})

describe('customer detail', () => {
  it('returns recent orders newest first', async () => {
    const all = await listCustomers()
    const withOrders = all.data.find((c) => c.orderCount > 1)!

    const res = await app.request(`/customers/${withOrders.id}`)
    expect(res.status).toBe(200)

    const detail = (await res.json()) as CustomerDetail
    expect(detail.id).toBe(withOrders.id)
    expect(detail.recentOrders.length).toBeGreaterThan(1)

    const placed = detail.recentOrders.map((o) => Date.parse(o.placedAt))
    expect(placed).toEqual(placed.toSorted((a, b) => b - a))
  })

  it('404s for a customer that does not exist', async () => {
    const res = await app.request('/customers/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })
})

describe('customer writes', () => {
  it('creates a customer', async () => {
    const res = await json('/customers', 'POST', {
      name: 'Priya Raman',
      phone: '+6591230000',
      email: 'priya@example.com',
    })
    expect(res.status).toBe(201)

    const created = (await res.json()) as Customer
    expect(created.name).toBe('Priya Raman')
    expect(created.orderCount).toBe(0)
  })

  it('rejects a blank name', async () => {
    const res = await json('/customers', 'POST', { name: '' })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED')
  })

  it('rejects a malformed email', async () => {
    const res = await json('/customers', 'POST', { name: 'Bad Email', email: 'not-an-email' })
    expect(res.status).toBe(422)
  })

  it('updates a customer', async () => {
    const created = (await (
      await json('/customers', 'POST', { name: 'Wei Ling' })
    ).json()) as Customer

    const res = await json(`/customers/${created.id}`, 'PATCH', { notes: 'Allergic to peanuts' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { notes: string }).notes).toBe('Allergic to peanuts')
  })

  it('404s updating a customer that does not exist', async () => {
    const res = await json('/customers/00000000-0000-0000-0000-000000000000', 'PATCH', {
      name: 'Ghost',
    })
    expect(res.status).toBe(404)
  })
})
