import { useMemo, useState } from 'react'

export type InteractionState = {
  hovered: boolean
  pressed: boolean
  focused: boolean
}

/**
 * Written once, consumed by every interactive primitive. That is what
 * guarantees hover, press and focus behave identically everywhere — and why no
 * screen ever hand-rolls an interaction state.
 *
 * React Native has no concept of hover or keyboard focus on most components, so
 * both are wired explicitly here rather than inherited from the platform.
 */
export function useInteractionState() {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)

  const handlers = useMemo(
    () => ({
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    }),
    [],
  )

  return { state: { hovered, pressed, focused }, handlers }
}
