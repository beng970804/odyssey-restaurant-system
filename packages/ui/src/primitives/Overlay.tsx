import { useEffect, type ReactNode } from 'react'
import { Platform, Pressable, View, type ViewStyle } from 'react-native'
import { createPortal } from 'react-dom'
import { useTheme } from '../theme/ThemeProvider'

/**
 * A react-native-web position that React Native's own style types do not know
 * about, which is why it is asserted here rather than written inline.
 */
const VIEWPORT_FIXED = 'fixed' as ViewStyle['position']

export type OverlayProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'center' | 'right'
}

/**
 * The shared half of Modal and Drawer: a backdrop that closes on click, and
 * Escape-to-close wired once. Both behaviours are easy to forget per component
 * and jarring to miss.
 *
 * On the web it renders through a portal to the document body. An overlay must
 * cover the viewport wherever it is *written*, and an absolutely positioned one
 * only covers its nearest positioned ancestor — a modal opened from inside a
 * card was laid out inside that card, clipped and half off it. `position:
 * fixed` alone would not do it either: the nav drawer's surface carries a
 * transform, and any transform makes an ancestor the containing block for the
 * fixed descendants inside it. The portal escapes both.
 */
export function Overlay({ open, onClose, children, align = 'center' }: OverlayProps) {
  const theme = useTheme()

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const overlay = (
    <View
      style={{
        // On native the portal below is skipped and this falls back to filling
        // its parent, which is where a native overlay is mounted anyway.
        position: Platform.OS === 'web' ? VIEWPORT_FIXED : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: align === 'center' ? 'center' : 'stretch',
        justifyContent: align === 'center' ? 'center' : 'flex-end',
      }}
    >
      <Pressable
        aria-label="Close"
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.35)',
        }}
      />
      {children}
    </View>
  )

  return Platform.OS === 'web' && typeof document !== 'undefined'
    ? createPortal(overlay, document.body)
    : overlay
}
