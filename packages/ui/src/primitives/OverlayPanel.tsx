import type { ReactNode } from 'react'
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Divider } from './Divider'
import { IconButton } from './IconButton'
import { Inline } from './Inline'
import { Text } from './Text'

/**
 * What a panel must leave of the viewport, and the least it may keep for
 * itself. A Modal splits the gutter across both sides; a Drawer spends all of
 * it on the one edge it is not anchored to. Either way a panel as wide as the
 * page *is* the page — nothing behind it says "you have not navigated away",
 * and the tap-to-close backdrop has nowhere left to be tapped. The floor keeps
 * a zero-width test viewport from collapsing the panel entirely.
 */
const EDGE_GUTTER = 48
const MIN_PANEL_WIDTH = 280

/** The width a panel may actually take: what it asked for, viewport allowing. */
export function usePanelWidth(requested: number): number {
  const viewport = useWindowDimensions().width
  return Math.min(requested, Math.max(MIN_PANEL_WIDTH, viewport - EDGE_GUTTER))
}

export type OverlayPanelProps = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Placement, size and the motion that carries it in — the caller's business. */
  style?: StyleProp<ViewStyle>
}

/**
 * The chrome a Modal and a Drawer share: a titled header with one way out, a
 * rule under it, the body, and a footer rule when there is a footer.
 *
 * Only the surface's shape and how it arrives differ between the two, so those
 * are the caller's, and this is everything else. Written once because a close
 * button that drifts between two dialogs is the kind of inconsistency nobody
 * files a bug about and everybody notices.
 */
export function OverlayPanel({ title, onClose, children, footer, style }: OverlayPanelProps) {
  const theme = useTheme()

  return (
    <View role="dialog" aria-label={title} style={style}>
      <Inline justify="space-between" style={{ padding: theme.space.lg }}>
        <Text variant="h2">{title}</Text>
        <IconButton label="Close" onPress={onClose}>
          <Text variant="body" color="muted">
            ✕
          </Text>
        </IconButton>
      </Inline>
      <Divider />

      {children}

      {footer ? (
        <>
          <Divider />
          <Inline justify="flex-end" gap="sm" style={{ padding: theme.space.lg }}>
            {footer}
          </Inline>
        </>
      ) : null}
    </View>
  )
}
