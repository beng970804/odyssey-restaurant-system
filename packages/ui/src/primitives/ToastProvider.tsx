import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import type { StatusTone } from '../theme/types'
import { Text } from './Text'

type Toast = { id: number; message: string; tone: StatusTone }

type ToastControl = { show: (message: string, tone?: StatusTone) => void }

const ToastContext = createContext<ToastControl>({ show: () => {} })

const DISMISS_AFTER_MS = 4000

/**
 * The single feedback channel: every mutation in the app reports through here,
 * so success and failure look the same wherever they happen.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, tone: StatusTone = 'neutral') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), DISMISS_AFTER_MS)
  }, [])

  const control = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={control}>
      {children}
      <View
        style={{
          position: 'absolute',
          right: theme.space.xl,
          bottom: theme.space.xl,
          gap: theme.space.sm,
          zIndex: 200,
        }}
      >
        {toasts.map((toast) => (
          <View
            key={toast.id}
            role="status"
            style={[
              {
                paddingHorizontal: theme.space.lg,
                paddingVertical: theme.space.md,
                borderRadius: theme.radius.md,
                borderWidth: theme.borderWidth.thin,
                backgroundColor: theme.color.status[toast.tone].bg,
                borderColor: theme.color.status[toast.tone].border,
              },
              theme.elevation.overlay,
            ]}
          >
            <Text variant="bodyStrong" style={{ color: theme.color.status[toast.tone].fg }}>
              {toast.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
