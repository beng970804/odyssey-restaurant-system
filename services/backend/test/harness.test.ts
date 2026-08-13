import { afterAll, beforeAll, expect, it } from 'vitest'
import { orders } from '../src/db/schema'
import { seed } from '../src/db/seed'
import { createTestApp } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'

let db: TestDb
let cleanup: () => Promise<void>

beforeAll(async () => {
  ;({ db, cleanup } = await createTestDb())
})

afterAll(async () => {
  await cleanup()
})

it('migrates a pristine PGlite database', async () => {
  expect(await db.select().from(orders)).toEqual([])
})

it('enforces the same constraints as production Postgres', async () => {
  // Not a vanity check: PGlite is only useful as a test target if the check
  // constraints from the migration are actually live in it.
  // Drizzle wraps driver errors, so the constraint name is on the cause rather
  // than the message.
  const error = await db
    .execute(`insert into settings (id, opening_hours) values (2, '{}'::jsonb)`)
    .then(
      () => null,
      (e: Error) => e,
    )

  expect(error).not.toBeNull()
  expect(String(error?.cause ?? error)).toMatch(/settings_singleton/)
})

it('serves a route through the full stack, bound to the test db', async () => {
  await seed(db)

  const res = await createTestApp(db).request('/categories')
  expect(res.status).toBe(200)

  const body = (await res.json()) as { data: { name: string }[]; meta: { total: number } }
  expect(body.meta.total).toBe(6)
  expect(body.data.map((c) => c.name)).toContain('Mains')
})

it('runs the real seed, producing every order status', async () => {
  const rows = await db.select().from(orders)
  expect(rows).toHaveLength(60)
  expect(new Set(rows.map((o) => o.status)).size).toBe(6)
})
