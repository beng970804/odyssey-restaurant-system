import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Divider } from './Divider'
import { IconButton } from './IconButton'
import { Inline } from './Inline'
import { Overlay } from './Overlay'
import { Text } from './Text'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

/** A Modal anchored to the right edge — same backdrop, different placement. */
export function Drawer({ open, onClose, title, children, footer, width = 480 }: DrawerProps) {
  const theme = useTheme()

  return (
    <Overlay open={open} onClose={onClose} align="right">
      <View
        role="dialog"
        aria-label={title}
        style={[
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
        <Inline justify="space-between" style={{ padding: theme.space.lg }}>
          <Text variant="h2">{title}</Text>
          <IconButton label="Close" onPress={onClose}>
            <Text variant="body" color="muted">
              ✕
            </Text>
          </IconButton>
        </Inline>
        <Divider />
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg }}>
          {children}
        </ScrollView>
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
