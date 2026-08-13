import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * The Node-side counterpart to `createDb`. Migrate, seed and reset run in Node
 * rather than in the Worker, so they never touch the driver factory. Tests use
 * PGlite and touch neither.
 */
export function requireDatabaseUrl(): string {
  // Node 24 can read .env without a dependency. Absent file is not an error —
  // CI and production supply the variable directly.
  try {
    process.loadEnvFile(new URL('../../.env', import.meta.url))
  } catch {
    // no .env present
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy services/backend/.env.example to .env, or run `pnpm db:up` first.',
    )
  }
  return url
}

export function createNodeDb(url: string = requireDatabaseUrl()) {
  // onnotice: `drop schema … cascade` in the reset script emits one NOTICE per
  // dropped object, which postgres-js dumps as a wall of objects. Nothing here
  // acts on notices.
  const client = postgres(url, { max: 1, onnotice: () => {} })
  return { db: drizzle(client, { schema }), client }
}
