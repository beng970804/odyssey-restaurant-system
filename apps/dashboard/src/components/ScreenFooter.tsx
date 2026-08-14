import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

/**
 * A slot pinned under the shell's scroll area, for the one element a screen
 * needs to keep on the device's edge — the New Order recap bar. CSS `sticky`
 * did this on the web and is silently ignored on native, where the bar
 * scrolled away with the menu; a slot outside the ScrollView is pinned by
 * construction, on every platform.
 *
 * The plumbing is a store rather than shell state on purpose: the footer's
 * content is born on every screen render, and writing it into state the shell
 * renders *from* would re-render the screen that wrote it — a loop. Only the
 * host subscribes, and the host does not contain the screen.
 */
type FooterStore = {
  node: ReactNode
  listeners: Set<() => void>
  set: (node: ReactNode) => void
  subscribe: (listener: () => void) => () => void
}

export function createFooterStore(): FooterStore {
  const store: FooterStore = {
    node: null,
    listeners: new Set(),
    set: (node) => {
      store.node = node
      for (const listener of store.listeners) listener()
    },
    subscribe: (listener) => {
      store.listeners.add(listener)
      return () => store.listeners.delete(listener)
    },
  }
  return store
}

const FooterContext = createContext<FooterStore | null>(null)

export const ScreenFooterProvider = FooterContext.Provider

/**
 * Rendered by a screen; its children appear in the shell's dock. Outside the
 * shell — a test rendering the screen alone — there is no dock, and the
 * children render in place instead, which keeps the bar a fact of the screen
 * rather than a fact of the harness.
 */
export function ScreenFooter({ children }: { children: ReactNode }) {
  const store = useContext(FooterContext)

  useEffect(() => {
    if (!store) return
    store.set(children)
    return () => store.set(null)
  }, [store, children])

  return store ? null : <>{children}</>
}

const NO_SUBSCRIBE = () => () => {}

/** The dock itself. Sits beside the ScrollView in AppShell, never inside it. */
export function ScreenFooterHost({ style }: { style?: StyleProp<ViewStyle> }) {
  const store = useContext(FooterContext)
  const node = useSyncExternalStore(store?.subscribe ?? NO_SUBSCRIBE, () => store?.node ?? null)

  if (node === null || node === undefined) return null
  return <View style={style}>{node}</View>
}
