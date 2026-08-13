import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql } from 'drizzle-orm'
import { createNodeDb } from './node-client'
import { seed } from './seed'

const { db, client } = createNodeDb()

// Drop everything, including drizzle's migration bookkeeping, so the migration
// replays from zero rather than believing it is already up to date.
await db.execute(sql`drop schema if exists public cascade`)
await db.execute(sql`create schema public`)
await db.execute(sql`drop schema if exists drizzle cascade`)

await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname })

const summary = await seed(db)
await client.end()

console.log(
  `reset complete — ${summary.categories} categories, ${summary.menuItems} menu items, ` +
    `${summary.customers} customers, ${summary.orders} orders`,
)
