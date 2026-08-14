import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Pressable, View } from 'react-native'
import { prefersReducedMotion } from '../hooks/motion'
import { useTheme } from '../theme/ThemeProvider'
import type { StatusTone } from '../theme/types'
import { overlayTransition } from './Overlay'
import { Text } from './Text'

type Toast = { id: number; message: string; tone: StatusTone }

type ToastControl = { show: (message: string, tone?: StatusTone) => void }

const ToastContext = createContext<ToastControl>({ show: () => {} })

const DISMISS_AFTER_MS = 4000

/** On the overlay's clock: out quicker than in, so a press feels obeyed. */
const TOAST_ENTER_MS = 220
const TOAST_EXIT_MS = 150

/** How far below its resting place a toast starts, and returns to leave. */
const RISE = 8

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
  }, [])

  const remove = useCallback(
    (id: number) => setToasts((current) => current.filter((t) => t.id !== id)),
    [],
  )

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
          <ToastCard key={toast.id} toast={toast} onDone={() => remove(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

/**
 * Each card runs its own clock: entrance, the dismissal countdown, and the
 * exit it plays before asking the provider to drop it — a component removed
 * the instant it dismisses has no chance to animate out.
 */
function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const theme = useTheme()
  // Always starts false, so the hidden styles paint once and the entrance has
  // somewhere to run from — the same two-step the Overlay does.
  const [shown, setShown] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const frame = setTimeout(() => setShown(true), 0)
    return () => clearTimeout(frame)
  }, [])

  // Hovering is reading, and the countdown holds while it lasts. It restarts
  // in full when the pointer leaves: a reader gets whole seconds, not whatever
  // remainder the interruption left.
  useEffect(() => {
    if (hovered || leaving) return
    const timer = setTimeout(() => setLeaving(true), DISMISS_AFTER_MS)
    return () => clearTimeout(timer)
  }, [hovered, leaving])

  useEffect(() => {
    if (!leaving) return
    // No motion means no exit to wait for — gone the moment it is dismissed,
    // not a frame later.
    if (prefersReducedMotion()) {
      onDone()
      return
    }
    const exit = setTimeout(onDone, TOAST_EXIT_MS)
    return () => clearTimeout(exit)
  }, [leaving, onDone])

  const visible = shown && !leaving

  return (
    <Pressable
      role="status"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => setLeaving(true)}
      style={[
        {
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: theme.borderWidth.thin,
          backgroundColor: theme.color.status[toast.tone].bg,
          borderColor: theme.color.status[toast.tone].border,
          opacity: visible ? 1 : 0,
          transform: [{ translateY: visible ? 0 : RISE }],
        },
        overlayTransition('opacity, transform', visible ? TOAST_ENTER_MS : TOAST_EXIT_MS),
        theme.elevation.overlay,
      ]}
    >
      <Text variant="bodyStrong" style={{ color: theme.color.status[toast.tone].fg }}>
        {toast.message}
      </Text>
    </Pressable>
  )
}

export const useToast = () => useContext(ToastContext)
