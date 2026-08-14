import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from '../src/primitives/Skeleton'
import { wrap } from './helpers'

/** The shared setup answers every media query false; this narrows one. */
function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('Skeleton', () => {
  it('pulses while it waits, so loading reads as alive rather than stuck', () => {
    setReducedMotion(false)
    wrap(<Skeleton />)

    expect(screen.getByTestId('skeleton')).toHaveStyle({ animationIterationCount: 'infinite' })
  })

  it('holds still under reduced motion', () => {
    setReducedMotion(true)
    wrap(<Skeleton />)

    expect(screen.getByTestId('skeleton')).not.toHaveStyle({
      animationIterationCount: 'infinite',
    })
  })
})
