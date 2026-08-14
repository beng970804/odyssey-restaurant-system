import { useEffect, useState } from 'react'

/**
 * A running clock. Ticks once a second and re-renders only when the value the
 * caller actually displays changes, so a header showing minutes re-renders
 * sixty times less often than the interval fires.
 *
 * `format` runs against the current instant; the hook holds the formatted
 * string rather than the timestamp, which is what makes that comparison cheap.
 */
export function useNow(format: (now: number) => string): string {
  const [value, setValue] = useState(() => format(Date.now()))

  useEffect(() => {
    // Re-formats immediately as well as on the interval, so a change of
    // timezone or format is not held back until the next tick.
    setValue(format(Date.now()))

    const id = setInterval(() => setValue(format(Date.now())), 1000)
    return () => clearInterval(id)
  }, [format])

  return value
}
