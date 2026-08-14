import { ORDER_STATUS_LABELS, type OrderStatus } from '@repo/types'
import { Badge, overlayTransition, prefersReducedMotion } from '@repo/ui'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { toneForStatus } from './formatting'

/** Bigger for a beat, then back — enough to catch the eye that pressed. */
const FLASH_SCALE = 1.08
const FLASH_MS = 300

/**
 * True for one beat whenever the value changes after mount. Arriving is not
 * changing: a list of badges rendering in must not ripple.
 */
function useFlashOnChange(value: unknown): boolean {
  const [flashing, setFlashing] = useState(false)
  const previous = useRef(value)

  useEffect(() => {
    if (previous.current === value) return
    previous.current = value
    if (prefersReducedMotion()) return

    setFlashing(true)
    const timer = setTimeout(() => setFlashing(false), FLASH_MS)
    return () => clearTimeout(timer)
  }, [value])

  return flashing
}

/**
 * Order actions land optimistically, so this badge *is* the confirmation the
 * pass gets — it swells for a beat when its status swaps, instead of leaving
 * the change to be eventually noticed.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const flashing = useFlashOnChange(status)

  return (
    <View
      testID="status-badge"
      style={[
        { transform: [{ scale: flashing ? FLASH_SCALE : 1 }] },
        overlayTransition('transform', FLASH_MS),
      ]}
    >
      <Badge tone={toneForStatus(status)}>{ORDER_STATUS_LABELS[status]}</Badge>
    </View>
  )
}
