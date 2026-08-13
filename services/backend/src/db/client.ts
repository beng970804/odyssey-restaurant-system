import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'
import type { Env } from '../app'

/** The one shape both drivers satisfy. Nothing above this file knows which is in use. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

export function createDb(env: Env): Db {
  if (env.DATABASE_DRIVER === 'postgres') {
    // Local dev: docker Postgres over TCP. Works inside `wrangler dev` because
    // of the nodejs_compat flag. max: 1 — a Worker isolate is single-request.
    return drizzlePostgres(postgres(env.DATABASE_URL, { max: 1 }), { schema }) as unknown as Db
  }
  // Production: Neon over WebSocket. Chosen over neon-http because this driver
  // supports interactive transactions, which order creation requires —
  // neon-http throws at runtime on db.transaction(). A fresh Pool per request
  // is the standard Workers pattern and fine at this scale.
  return drizzleNeon(new Pool({ connectionString: env.DATABASE_URL }), {
    schema,
  }) as unknown as Db
}
