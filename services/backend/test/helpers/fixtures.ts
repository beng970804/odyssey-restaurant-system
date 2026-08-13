import { eq } from 'drizzle-orm'
import type { OpeningHours } from '@repo/shared'
import { categories, customers, menuItems, settings } from '../../src/db/schema'
import type { TestDb } from './db'

const openingHours: OpeningHours = {
  mon: { open: '11:00', close: '22:00' },
  tue: { open: '11:00', close: '22:00' },
  wed: { open: '11:00', close: '22:00' },
  thu: { open: '11:00', close: '22:00' },
  fri: { open: '11:00', close: '23:00' },
  sat: { open: '11:00', close: '23:00' },
  sun: { closed: true },
}

/**
 * The narrow fixture the order tests reason about: two priced items whose
 * arithmetic matches the worked example in spec §5.3, one sold-out item, and a
 * settings row the test can move underneath the API.
 */
export async function seedMinimal(db: TestDb) {
  const [category] = await db.insert(categories).values({ name: 'Mains', sortOrder: 0 }).returning()

  const [nasiLemak, tehTarik, soldOut] = await db
    .insert(menuItems)
    .values([
      { categoryId: category!.id, name: 'Nasi Lemak', priceCents: 850 },
      { categoryId: category!.id, name: 'Teh Tarik', priceCents: 320 },
      { categoryId: category!.id, name: 'Chilli Crab', priceCents: 4800, isAvailable: false },
    ])
    .returning()

  const [customer] = await db
    .insert(customers)
    .values({ name: 'Aisyah Rahman', phone: '+65 8123 4567' })
    .returning()

  await db.insert(settings).values({
    id: 1,
    openingHours,
    taxRatePercent: 9,
    deliveryFeeCents: 400,
    defaultPrepTimeMinutes: 20,
    autoAcceptOrders: false,
    timezone: 'Asia/Singapore',
  })

  return {
    category: category!,
    nasiLemak: nasiLemak!,
    tehTarik: tehTarik!,
    soldOut: soldOut!,
    customer: customer!,
    setSettings: (patch: Partial<typeof settings.$inferInsert>) =>
      db.update(settings).set(patch).where(eq(settings.id, 1)),
    setMenuItemPrice: (id: string, priceCents: number) =>
      db.update(menuItems).set({ priceCents }).where(eq(menuItems.id, id)),
  }
}
