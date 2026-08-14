/**
 * Barrel for the generated Zod schemas, re-exported from `index.ts` under the
 * `schemas` namespace because the names collide with the generated *types* of
 * the same contract — `CreateMenuItemBody` is both a type and a validator.
 *
 * It lives here rather than inside `generated/zod/` because orval's `clean`
 * empties that directory on every `pnpm gen:contract`.
 */
export * from './generated/zod/crm/crm.zod'
export * from './generated/zod/menu/menu.zod'
export * from './generated/zod/orders/orders.zod'
export * from './generated/zod/settings/settings.zod'
export * from './generated/zod/stats/stats.zod'
export * from './generated/zod/system/system.zod'
