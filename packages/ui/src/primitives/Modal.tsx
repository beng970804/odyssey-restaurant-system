import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Divider } from './Divider'
import { IconButton } from './IconButton'
import { Inline } from './Inline'
import {
  OVERLAY_ENTER_MS,
  OVERLAY_EXIT_MS,
  Overlay,
  overlayTransition,
  useOverlayShown,
} from './Overlay'
import { Stack } from './Stack'
import { Text } from './Text'

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
  const shown = useOverlayShown()

  return (
    <View
      role="dialog"
      aria-label={title}
      style={[
        {
          transform: [{ translateY: shown ? 0 : RISE }, { scale: shown ? 1 : START_SCALE }],
        },
        overlayTransition('transform', shown ? OVERLAY_ENTER_MS : OVERLAY_EXIT_MS),
        {
          width,
          maxWidth: '100%',
          maxHeight: '90%',
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.bg.overlay,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.default,
        },
        theme.elevation.modal,
      ]}
    >
      <Inline justify="space-between" style={{ padding: theme.space.lg }}>
        <Text variant="h2">{title}</Text>
        <IconButton label="Close" onPress={onClose}>
          <Text variant="body" color="muted">
            ✕
          </Text>
        </IconButton>
      </Inline>
      <Divider />
      <Stack gap="md" style={{ padding: theme.space.lg }}>
        {children}
      </Stack>
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
