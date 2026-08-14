import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Overlay, overlayTransition, useOverlayMotion } from './Overlay'
import { OverlayPanel } from './OverlayPanel'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

/**
 * Slower than the default overlay, because the panel crosses its own width to
 * get here. At the dialog's 220ms a 480px slide reads as a flick; this is the
 * same gesture given room to be seen.
 */
const DRAWER_ENTER_MS = 360
const DRAWER_EXIT_MS = 240

/** A Modal anchored to the right edge — same backdrop, different placement. */
export function Drawer({ open, onClose, title, children, footer, width = 480 }: DrawerProps) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      align="right"
      enterMs={DRAWER_ENTER_MS}
      exitMs={DRAWER_EXIT_MS}
    >
      <DrawerSurface title={title} width={width} footer={footer} onClose={onClose}>
        {children}
      </DrawerSurface>
    </Overlay>
  )
}

/**
 * Split out so it sits *inside* the Overlay, where the open progress is
 * published: a drawer arrives by sliding in from the edge it is anchored to,
 * on the same clock as the backdrop behind it.
 */
function DrawerSurface({
  title,
  width,
  footer,
  onClose,
  children,
}: {
  title: string
  width: number
  footer?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const theme = useTheme()
  const { shown, enterMs, exitMs } = useOverlayMotion()

  return (
    <OverlayPanel
      title={title}
      onClose={onClose}
      footer={footer}
      style={[
        // Closed, the panel sits one full width past the edge; open, it is
        // flush with it.
        { transform: [{ translateX: shown ? 0 : width }] },
        overlayTransition('transform', shown ? enterMs : exitMs),
        {
          width,
          maxWidth: '100%',
          height: '100%',
          backgroundColor: theme.color.bg.overlay,
          borderLeftWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.default,
        },
        theme.elevation.modal,
      ]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg }}>
        {children}
      </ScrollView>
    </OverlayPanel>
  )
}
