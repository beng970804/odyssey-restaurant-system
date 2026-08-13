import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { createNodeDb } from './node-client'

const { db, client } = createNodeDb()

await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname })
await client.end()

console.log('migrations applied')
