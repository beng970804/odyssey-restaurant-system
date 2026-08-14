import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountUp } from '../src/hooks/useCountUp'

function Counter({ target, duration }: { target: number; duration?: number }) {
  const value = useCountUp(target, duration)
  return <output>{Math.round(value)}</output>
}

const reading = () => Number(screen.getByRole('status').textContent)

/** The shared setup reports reduced motion; these tests are about the motion. */
function allowMotion(reduced = false) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

/** Drives the frame clock, which vitest fakes alongside `performance.now`. */
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  allowMotion()
})

afterEach(() => vi.useRealTimers())

describe('useCountUp', () => {
  it('starts at zero and lands exactly on the target', () => {
    render(<Counter target={3813} duration={900} />)
    expect(reading()).toBe(0)

    advance(450)
    const midway = reading()
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(3813)

    // Exactly, not approximately: the last frame assigns the target rather than
    // easing towards it, so a revenue figure never settles a cent short.
    advance(500)
    expect(reading()).toBe(3813)
  })

  it('eases out, so most of the distance is covered early', () => {
    render(<Counter target={1000} duration={900} />)

    advance(450)
    expect(reading()).toBeGreaterThan(500)
  })

  it('snaps when the system asks for reduced motion', () => {
    allowMotion(true)
    render(<Counter target={3813} duration={900} />)

    expect(reading()).toBe(3813)
  })

  it('retargets from where it is rather than replaying from zero', () => {
    const { rerender } = render(<Counter target={100} duration={900} />)
    advance(900)
    expect(reading()).toBe(100)

    rerender(<Counter target={200} duration={900} />)
    // A refetch nudges the figure; it does not drop it back to nothing first.
    advance(50)
    expect(reading()).toBeGreaterThan(100)
  })

  it('lands on the target even when no frame ever arrives', () => {
    // A background tab or a headless browser never runs the callback. Left to
    // the frame clock alone the card would read zero forever, which is a wrong
    // number rather than a slow animation.
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0)
    render(<Counter target={3813} duration={900} />)

    expect(reading()).toBe(0)
    advance(1200)
    expect(reading()).toBe(3813)
  })

  it('stops the loop when it unmounts', () => {
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const { unmount } = render(<Counter target={100} duration={900} />)

    unmount()
    expect(cancel).toHaveBeenCalled()
  })
})
