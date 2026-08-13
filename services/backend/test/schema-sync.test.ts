import { expect, it } from 'vitest'
import { ORDER_CHANNELS, ORDER_STATUSES } from '@repo/types'
import { orderChannelValues, orderStatusValues } from '../src/db/schema'

// The tripwire that catches the two definitions drifting apart. The database
// column and the shared enum are declared in different packages by necessity —
// the frontend cannot import the Drizzle schema — so nothing but this test
// stops them diverging.
it('database status enum matches the shared status list', () => {
  expect([...orderStatusValues].sort()).toEqual([...ORDER_STATUSES].sort())
})

it('database channel enum matches the shared channel list', () => {
  expect([...orderChannelValues].sort()).toEqual([...ORDER_CHANNELS].sort())
})
