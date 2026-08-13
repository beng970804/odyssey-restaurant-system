import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile(new URL('.env', import.meta.url))
} catch {
  // no .env present — drizzle-kit generate does not need a live connection
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/restaurant',
  },
})
