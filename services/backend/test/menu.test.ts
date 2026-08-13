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

const json = (path: string, method: string, body: unknown) =>
  app.request(path, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

type MenuItem = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  priceCents: number
  isAvailable: boolean
  isArchived: boolean
  createdAt: string
}
type List<T> = { data: T[]; meta: { total: number } }

const listItems = async (query = ''): Promise<List<MenuItem>> => {
  const res = await app.request(`/menu-items${query}`)
  expect(res.status).toBe(200)
  return (await res.json()) as List<MenuItem>
}

describe('categories', () => {
  it('creates a category and returns it in the list', async () => {
    const res = await json('/categories', 'POST', { name: 'Specials', sortOrder: 99 })
    expect(res.status).toBe(201)

    const created = (await res.json()) as { id: string; name: string; sortOrder: number }
    expect(created.name).toBe('Specials')

    const list = (await (await app.request('/categories')).json()) as List<{ id: string }>
    expect(list.data.map((c) => c.id)).toContain(created.id)
  })

  it('rejects a blank name', async () => {
    const res = await json('/categories', 'POST', { name: '' })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED')
  })

  it('updates a category', async () => {
    const created = (await (
      await json('/categories', 'POST', { name: 'Seasonal', sortOrder: 50 })
    ).json()) as { id: string }

    const res = await json(`/categories/${created.id}`, 'PATCH', { name: 'Seasonal Picks' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { name: string }).name).toBe('Seasonal Picks')
  })

  it('404s updating a category that does not exist', async () => {
    const res = await json('/categories/00000000-0000-0000-0000-000000000000', 'PATCH', {
      name: 'Ghost',
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })
})

describe('menu items', () => {
  it('joins the category name onto every row', async () => {
    const list = await listItems()
    expect(list.data.length).toBeGreaterThan(0)
    expect(list.data.every((i) => i.categoryName.length > 0)).toBe(true)
    // The contract says timestamps cross the wire as ISO strings, not Dates.
    expect(list.data[0]!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('filters by availability', async () => {
    const list = await listItems('?available=true')
    expect(list.data.length).toBeGreaterThan(0)
    expect(list.data.every((i) => i.isAvailable)).toBe(true)

    const unavailable = await listItems('?available=false')
    expect(unavailable.data.length).toBeGreaterThan(0)
    expect(unavailable.data.every((i) => !i.isAvailable)).toBe(true)
  })

  it('filters by category', async () => {
    const all = await listItems()
    const categoryId = all.data[0]!.categoryId
    const list = await listItems(`?categoryId=${categoryId}`)
    expect(list.data.length).toBeGreaterThan(0)
    expect(list.data.every((i) => i.categoryId === categoryId)).toBe(true)
  })

  it('searches by name, case-insensitively', async () => {
    const all = await listItems()
    const target = all.data[0]!.name
    const list = await listItems(`?search=${encodeURIComponent(target.toLowerCase())}`)
    expect(list.data.map((i) => i.name)).toContain(target)
  })

  it('rejects a negative price', async () => {
    const res = await json('/menu-items', 'POST', {
      name: 'Free lunch',
      categoryId: '00000000-0000-0000-0000-000000000000',
      priceCents: -1,
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED')
  })

  it('creates an item under an existing category', async () => {
    const all = await listItems()
    const categoryId = all.data[0]!.categoryId

    const res = await json('/menu-items', 'POST', {
      categoryId,
      name: 'Chilli Crab Bun',
      priceCents: 1450,
    })
    expect(res.status).toBe(201)

    const created = (await res.json()) as MenuItem
    expect(created.priceCents).toBe(1450)
    expect(created.isAvailable).toBe(true)
    expect(created.categoryName.length).toBeGreaterThan(0)
  })

  it('404s creating an item under a category that does not exist', async () => {
    const res = await json('/menu-items', 'POST', {
      categoryId: '00000000-0000-0000-0000-000000000000',
      name: 'Orphan',
      priceCents: 100,
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })

  it('updates an item and bumps updatedAt', async () => {
    const all = await listItems()
    const item = all.data[0]!

    const res = await json(`/menu-items/${item.id}`, 'PATCH', {
      priceCents: 999,
      isAvailable: false,
    })
    expect(res.status).toBe(200)

    const updated = (await res.json()) as MenuItem
    expect(updated.priceCents).toBe(999)
    expect(updated.isAvailable).toBe(false)
  })

  it('archives rather than deletes', async () => {
    const before = await listItems()
    const id = before.data[0]!.id

    const res = await app.request(`/menu-items/${id}/archive`, { method: 'POST' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as MenuItem).isArchived).toBe(true)

    const after = await listItems()
    expect(after.data.find((i) => i.id === id)).toBeUndefined()

    // Archived is hidden, not gone — ADR 0001 forbids the hard delete.
    const withArchived = await listItems('?includeArchived=true')
    expect(withArchived.data.find((i) => i.id === id)?.isArchived).toBe(true)
  })

  it('404s archiving an item that does not exist', async () => {
    const res = await app.request('/menu-items/00000000-0000-0000-0000-000000000000/archive', {
      method: 'POST',
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })
})
