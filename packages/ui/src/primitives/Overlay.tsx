import { useEffect, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

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

  return (
    <View
      style={{
        position: 'absolute',
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
}
