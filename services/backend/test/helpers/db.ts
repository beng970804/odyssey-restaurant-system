import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../../src/db/schema'

/**
 * PGlite is real Postgres compiled to WebAssembly. Constraints, transactions
 * and SQL behave exactly as in production, but there is no Docker to install
 * and each call gets a pristine database in milliseconds.
 */
export async function createTestDb() {
  const client = new PGlite() // in-memory, fresh per call
  const db = drizzle(client, { schema })
  await migrate(db, {
    migrationsFolder: new URL('../../drizzle', import.meta.url).pathname,
  })
  return { db, cleanup: () => client.close() }
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>['db']
