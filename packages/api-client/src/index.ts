export { ApiError, customFetch } from './fetcher'
export { ApiProvider, createQueryClient } from './query-client'
export { unwrap } from './unwrap'

// Orval output. Never hand-edited (ADR 0002) — to change it, change the Drizzle
// schema or the route and run `pnpm gen:contract`.
export * from './generated/endpoints/crm/crm'
export * from './generated/endpoints/menu/menu'
export * from './generated/endpoints/orders/orders'
export * from './generated/endpoints/settings/settings'
export * from './generated/endpoints/stats/stats'
export * from './generated/endpoints/system/system'
export * from './generated/models'

// Namespaced: the validators share their names with the types above.
export * as schemas from './zod'
