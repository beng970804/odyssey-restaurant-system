import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

/** Fast out of the gate, gentle into the final digit. */
const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3

const DEFAULT_DURATION = 900

/** Grace before the failsafe decides the frame clock is not coming. */
const FAILSAFE_SLACK = 250

/**
 * Counts from where it is to where it is told, on the frame clock.
 *
 * Reanimated drives styles on the UI thread; a number that has to be *formatted*
 * every frame is React state by nature, so this is a plain rAF loop rather than
 * a worklet. Four cards and seven hundred milliseconds is not a budget problem.
 *
 * A later target retargets from the current value rather than restarting at
 * zero, so a refetch nudges the figure instead of replaying the whole reveal.
 */
export function useCountUp(target: number, duration = DEFAULT_DURATION) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  // Where the next run starts from, tracked outside state so a re-render
  // mid-flight does not restart the tween.
  const current = useRef(value)

  useEffect(() => {
    if (prefersReducedMotion() || duration <= 0) {
      current.current = target
      setValue(target)
      return
    }

    const from = current.current
    if (from === target) return

    let frame = 0
    let start: number | undefined

    const tick = (now: number) => {
      start ??= now
      const progress = Math.min((now - start) / duration, 1)
      const next = progress === 1 ? target : from + (target - from) * easeOutCubic(progress)

      current.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    /**
     * A frame clock that never ticks — a background tab, a headless browser —
     * would otherwise leave the figure reading zero indefinitely, which is not
     * a slow animation but a wrong number. The timer is the floor under that.
     */
    const failsafe = setTimeout(() => {
      if (current.current === target) return
      cancelAnimationFrame(frame)
      current.current = target
      setValue(target)
    }, duration + FAILSAFE_SLACK)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(failsafe)
    }
  }, [target, duration])

  return value
}
