import { eq } from 'drizzle-orm'
import type { OpeningHours } from '@repo/shared'
import type { OrderStatus } from '@repo/types'
import { categories, customers, menuItems, orderItems, orders, settings } from '../../src/db/schema'

type OrderInsert = typeof orders.$inferInsert
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

    /**
     * Writes an order straight into a given status. The API deliberately offers
     * no way to do this — status is a consequence of an Action — so a test that
     * needs to start from `ready` has to reach past it.
     */
    orderInStatus: async (status: OrderStatus, overrides: Partial<OrderInsert> = {}) => {
      const [order] = await db
        .insert(orders)
        .values({
          channel: 'takeaway',
          status,
          subtotalCents: 320,
          taxCents: 29,
          deliveryFeeCents: 0,
          totalCents: 349,
          ...overrides,
        })
        .returning()

      await db.insert(orderItems).values({
        orderId: order!.id,
        menuItemId: tehTarik!.id,
        nameSnapshot: tehTarik!.name,
        unitPriceCents: tehTarik!.priceCents,
        quantity: 1,
      })

      return order!
    },
  }
}
