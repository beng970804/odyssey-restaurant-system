import { describe, expect, it } from 'vitest'
import {
  canPerform,
  getAvailableActions,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  resolveTransition,
} from '../src/order-status'

describe('order transitions', () => {
  it('allows accept and cancel from pending', () => {
    expect(getAvailableActions('pending').toSorted()).toEqual(['accept', 'cancel'])
  })

  it('does not allow cancelling a ready order', () => {
    expect(canPerform('ready', 'cancel')).toBe(false)
    expect(getAvailableActions('ready')).toEqual(['complete'])
  })

  it('treats completed and cancelled as terminal', () => {
    expect(getAvailableActions('completed')).toEqual([])
    expect(getAvailableActions('cancelled')).toEqual([])
  })

  it('resolves the destination status for a legal action', () => {
    expect(resolveTransition('preparing', 'markReady')).toBe('ready')
  })

  it('returns null for an illegal action', () => {
    expect(resolveTransition('pending', 'complete')).toBeNull()
  })

  it('every status is reachable in the map', () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toBeDefined()
    }
  })
})
