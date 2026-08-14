import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { Overlay, overlayTransition, useOverlayMotion } from './Overlay'
import { OverlayPanel, usePanelWidth } from './OverlayPanel'
import { Stack } from './Stack'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <ModalSurface title={title} width={width} footer={footer} onClose={onClose}>
        {children}
      </ModalSurface>
    </Overlay>
  )
}

/** How far below its resting place the dialog starts, and how much smaller. */
const RISE = 12
const START_SCALE = 0.97

/**
 * Inside the Overlay, where the open progress is published: the dialog rises
 * and settles into place on the same clock as the backdrop dimming behind it.
 */
function ModalSurface({
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
  // Clamped, not `maxWidth: '100%'`: full width on a phone is edge to edge,
  // and a dialog with no ground around it reads as a navigation. The clamp
  // leaves half the gutter each side, since this panel is centred.
  const effectiveWidth = usePanelWidth(width)

  return (
    <OverlayPanel
      title={title}
      onClose={onClose}
      footer={footer}
      style={[
        {
          transform: [{ translateY: shown ? 0 : RISE }, { scale: shown ? 1 : START_SCALE }],
        },
        overlayTransition('transform', shown ? enterMs : exitMs),
        {
          width: effectiveWidth,
          maxHeight: '90%',
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.bg.overlay,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.default,
        },
        theme.elevation.modal,
      ]}
    >
      <Stack gap="md" style={{ padding: theme.space.lg }}>
        {children}
      </Stack>
    </OverlayPanel>
  )
}
