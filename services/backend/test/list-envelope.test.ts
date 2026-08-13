import { afterAll, beforeAll, expect, it } from 'vitest'
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

const LIST_PATHS = ['/categories', '/menu-items', '/customers', '/orders']

// Spec §8: "Lists are { data, meta: { total, page, pageSize } }" — under
// "Conventions applied uniformly, because consistency is itself a graded
// signal." One test so a fifth list endpoint cannot quietly invent its own.
it.each(LIST_PATHS)('%s returns the uniform list envelope', async (path) => {
  const res = await app.request(path)
  expect(res.status).toBe(200)

  const body = (await res.json()) as { data: unknown[]; meta: Record<string, number> }
  expect(Array.isArray(body.data)).toBe(true)
  expect(Object.keys(body.meta).toSorted()).toEqual(['page', 'pageSize', 'total'])
  expect(body.meta.total).toBeGreaterThanOrEqual(body.data.length)
  expect(body.meta.page).toBe(1)
})

it.each(LIST_PATHS)('%s honours a page size', async (path) => {
  const body = (await (await app.request(`${path}?pageSize=2`)).json()) as {
    data: unknown[]
    meta: { pageSize: number }
  }
  expect(body.data.length).toBeLessThanOrEqual(2)
  expect(body.meta.pageSize).toBe(2)
})

it.each(LIST_PATHS)('%s caps the page size', async (path) => {
  expect((await app.request(`${path}?pageSize=101`)).status).toBe(422)
})
