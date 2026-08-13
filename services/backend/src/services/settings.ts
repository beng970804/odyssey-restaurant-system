import { eq } from 'drizzle-orm'
import { settings } from '../db/schema'
import { AppError } from '../lib/errors'
import type { Db } from '../db/client'

export const SETTINGS_ID = 1

/**
 * The order pipeline reads tax rate, delivery fee, channel switches and opening
 * hours from here, so a missing row is a broken installation rather than a
 * routine empty result — it fails loudly instead of returning null.
 */
export async function getSettings(db: Db) {
  const [row] = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Settings row is missing — run pnpm db:seed', 404)
  return row
}

export async function updateSettings(db: Db, patch: Partial<typeof settings.$inferInsert>) {
  const [row] = await db
    .update(settings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(settings.id, SETTINGS_ID))
    .returning()
  if (!row) throw new AppError('NOT_FOUND', 'Settings row is missing — run pnpm db:seed', 404)
  return row
}
