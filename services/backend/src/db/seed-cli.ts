import { createNodeDb } from './node-client'
import { seed } from './seed'

const { db, client } = createNodeDb()

const summary = await seed(db)
await client.end()

console.log(
  `${summary.categories} categories, ${summary.menuItems} menu items, ` +
    `${summary.customers} customers, ${summary.orders} orders`,
)
