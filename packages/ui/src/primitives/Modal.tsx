import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Divider } from './Divider'
import { IconButton } from './IconButton'
import { Inline } from './Inline'
import { Overlay } from './Overlay'
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
  const theme = useTheme()

  return (
    <Overlay open={open} onClose={onClose}>
      <View
        role="dialog"
        aria-label={title}
        style={[
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
    </Overlay>
  )
}
