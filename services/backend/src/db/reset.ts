import { sql } from 'drizzle-orm'
import { createNodeDb } from './node-client'

const { db, client } = createNodeDb()

// Drop everything, including drizzle's migration bookkeeping, so `db:migrate`
// replays from zero rather than believing it is already up to date.
await db.execute(sql`drop schema if exists public cascade`)
await db.execute(sql`create schema public`)
await db.execute(sql`drop schema if exists drizzle cascade`)
await client.end()

console.log('database dropped — run `pnpm db:migrate` and `pnpm db:seed` next')
