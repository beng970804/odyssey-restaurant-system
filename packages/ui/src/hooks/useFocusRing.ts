import type { ViewStyle } from 'react-native'
import type { InteractionState } from './useInteractionState'
import type { Theme } from '../theme/types'

/**
 * `:focus-visible` semantics by hand: the ring appears on keyboard focus and
 * stays out of the way on mouse press. React Native provides neither, and
 * without a visible ring the dashboard cannot be operated by keyboard at all —
 * so this is written once and consumed by every focusable primitive.
 *
 * Hidden is expressed as zero width rather than `outlineStyle: 'none'`, which
 * React Native's style types do not admit. On native the outline properties are
 * ignored entirely, which is correct: native has no keyboard focus ring.
 */
export function focusRingStyle(
  theme: Theme,
  state: Pick<InteractionState, 'focused' | 'pressed'>,
): ViewStyle {
  if (!state.focused || state.pressed) return { outlineWidth: 0 }

  return {
    outlineStyle: 'solid',
    outlineWidth: theme.borderWidth.medium,
    outlineColor: theme.color.border.focus,
    outlineOffset: 2,
  }
}
