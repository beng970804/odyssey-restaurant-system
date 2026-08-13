import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import type { OpeningHours } from '@repo/shared'

export const orderStatusValues = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const
export const orderChannelValues = ['dine_in', 'takeaway', 'delivery'] as const

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    isArchived: boolean('is_archived').notNull().default(false),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('menu_items_category_idx').on(t.categoryId),
    check('menu_items_price_non_negative', sql`${t.priceCents} >= 0`),
  ],
)

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: serial('order_number').notNull(),
    customerId: uuid('customer_id').references(() => customers.id),
    channel: text('channel', { enum: orderChannelValues }).notNull(),
    status: text('status', { enum: orderStatusValues }).notNull().default('pending'),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxCents: integer('tax_cents').notNull(),
    deliveryFeeCents: integer('delivery_fee_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    estimatedReadyAt: timestamp('estimated_ready_at', { withTimezone: true }),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('orders_status_idx').on(t.status),
    index('orders_placed_at_idx').on(t.placedAt),
    index('orders_customer_idx').on(t.customerId),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id),
    // Frozen at the moment the order was placed (ADR 0001). These deliberately
    // do not follow later menu edits.
    nameSnapshot: text('name_snapshot').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    check('order_items_quantity_positive', sql`${t.quantity} > 0`),
  ],
)

export const settings = pgTable(
  'settings',
  {
    id: integer('id').primaryKey().default(1),
    defaultPrepTimeMinutes: integer('default_prep_time_minutes').notNull().default(20),
    autoAcceptOrders: boolean('auto_accept_orders').notNull().default(false),
    dineInEnabled: boolean('dine_in_enabled').notNull().default(true),
    takeawayEnabled: boolean('takeaway_enabled').notNull().default(true),
    deliveryEnabled: boolean('delivery_enabled').notNull().default(true),
    deliveryFeeCents: integer('delivery_fee_cents').notNull().default(400),
    taxRatePercent: integer('tax_rate_percent').notNull().default(9),
    currency: text('currency').notNull().default('SGD'),
    timezone: text('timezone').notNull().default('Asia/Singapore'),
    openingHours: jsonb('opening_hours').$type<OpeningHours>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // The database itself refuses a second settings row. Enforcing the rule in
  // the schema rather than in application code means it holds even against a
  // mistaken seed script.
  (t) => [check('settings_singleton', sql`${t.id} = 1`)],
)

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}))

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({ items: many(menuItems) }))

export const customersRelations = relations(customers, ({ many }) => ({ orders: many(orders) }))
