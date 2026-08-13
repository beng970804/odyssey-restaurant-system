import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderAction, type OrderStatus } from '@repo/types'
import { createTestApp } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedMinimal } from './helpers/fixtures'

const ACTION_PATHS: Record<OrderAction, string> = {
  accept: 'accept',
  startPreparing: 'start-preparing',
  markReady: 'mark-ready',
  complete: 'complete',
  cancel: 'cancel',
}

type OrderBody = { status: OrderStatus; cancellationReason: string | null; updatedAt: string }
type ErrorBody = {
  error: { code: string; details?: { currentStatus?: string; allowedActions?: string[] } }
}

describe('order actions', () => {
  let app: ReturnType<typeof createTestApp>
  let cleanup: () => Promise<void>
  let fixtures: Awaited<ReturnType<typeof seedMinimal>>

  beforeEach(async () => {
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
    fixtures = await seedMinimal(testDb.db)
    app = createTestApp(testDb.db)
  })

  afterEach(async () => {
    await cleanup()
  })

  const act = (id: string, path: string, body: unknown = {}) =>
    app.request(`/orders/${id}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  // Data-driven from the shared map rather than restating it: add a status to
  // ORDER_TRANSITIONS and this suite grows with it, because it *is* the map.
  for (const status of ORDER_STATUSES) {
    const transitions = Object.entries(ORDER_TRANSITIONS[status]) as [OrderAction, OrderStatus][]

    for (const [action, expected] of transitions) {
      it(`allows ${action} from ${status} -> ${expected}`, async () => {
        const order = await fixtures.orderInStatus(status)
        const res = await act(
          order.id,
          ACTION_PATHS[action],
          action === 'cancel' ? { reason: 'Out of stock' } : {},
        )
        expect(res.status).toBe(200)
        expect(((await res.json()) as OrderBody).status).toBe(expected)
      })
    }

    for (const action of Object.keys(ACTION_PATHS) as OrderAction[]) {
      if (action in ORDER_TRANSITIONS[status]) continue

      it(`refuses ${action} from ${status}`, async () => {
        const order = await fixtures.orderInStatus(status)
        const res = await act(order.id, ACTION_PATHS[action], { reason: 'Out of stock' })
        // 409 rather than 400: the request is well-formed — it is the state
        // that makes it impossible.
        expect(res.status).toBe(409)
        expect(((await res.json()) as ErrorBody).error.code).toBe('INVALID_TRANSITION')
      })
    }
  }

  it('names the current status and the legal actions on a conflict', async () => {
    const order = await fixtures.orderInStatus('pending')
    const res = await act(order.id, 'complete')
    expect(res.status).toBe(409)

    const body = (await res.json()) as ErrorBody
    expect(body.error.code).toBe('INVALID_TRANSITION')
    expect(body.error.details?.currentStatus).toBe('pending')
    // Returned so the frontend can refresh its buttons after a conflict rather
    // than guessing.
    expect(body.error.details?.allowedActions?.toSorted()).toEqual(['accept', 'cancel'])
  })

  it('treats terminal statuses as terminal', async () => {
    for (const status of ['completed', 'cancelled'] as const) {
      const order = await fixtures.orderInStatus(status)
      for (const path of Object.values(ACTION_PATHS)) {
        expect((await act(order.id, path, { reason: 'x' })).status).toBe(409)
      }
    }
  })

  it('refuses to cancel a ready order — the food is made', async () => {
    const order = await fixtures.orderInStatus('ready')
    expect((await act(order.id, 'cancel', { reason: 'changed mind' })).status).toBe(409)
  })

  it('requires a reason to cancel', async () => {
    const order = await fixtures.orderInStatus('pending')
    expect((await act(order.id, 'cancel', {})).status).toBe(422)
    expect((await act(order.id, 'cancel', { reason: '' })).status).toBe(422)
  })

  it('stores the cancellation reason', async () => {
    const order = await fixtures.orderInStatus('pending')
    await act(order.id, 'cancel', { reason: 'Kitchen closed early' })

    const after = (await (await app.request(`/orders/${order.id}`)).json()) as OrderBody
    expect(after.status).toBe('cancelled')
    expect(after.cancellationReason).toBe('Kitchen closed early')
  })

  it('leaves the cancellation reason empty for other actions', async () => {
    const order = await fixtures.orderInStatus('pending')
    const body = (await (await act(order.id, 'accept')).json()) as OrderBody
    expect(body.cancellationReason).toBeNull()
  })

  it('advances an order through its whole lifecycle', async () => {
    const order = await fixtures.orderInStatus('pending')
    const statuses: OrderStatus[] = []

    for (const path of ['accept', 'start-preparing', 'mark-ready', 'complete']) {
      const res = await act(order.id, path)
      expect(res.status).toBe(200)
      statuses.push(((await res.json()) as OrderBody).status)
    }

    expect(statuses).toEqual(['accepted', 'preparing', 'ready', 'completed'])
  })

  it('404s for an unknown order', async () => {
    const res = await act('00000000-0000-0000-0000-000000000000', 'accept')
    expect(res.status).toBe(404)
    expect(((await res.json()) as ErrorBody).error.code).toBe('NOT_FOUND')
  })
})
