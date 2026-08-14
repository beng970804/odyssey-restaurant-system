import { IconButton, Text } from '@repo/ui'
import { createContext, useContext, type ReactNode } from 'react'

type NavToggleState = { open: boolean; onOpenChange: (open: boolean) => void }

const NavToggleContext = createContext<NavToggleState | null>(null)

/**
 * The drawer's open state, published so a screen header can carry the toggle.
 *
 * The dashboard layout renders `<AppShell><Slot /></AppShell>`, so a screen has
 * no way to hand anything up to the shell — context is what lets the button
 * live on the header row while the shell keeps owning the state.
 */
export function NavToggleProvider({
  open,
  onOpenChange,
  children,
}: NavToggleState & { children: ReactNode }) {
  return (
    <NavToggleContext.Provider value={{ open, onOpenChange }}>{children}</NavToggleContext.Provider>
  )
}

/** Renders nothing outside a provider, so a header is usable on its own. */
export function NavToggle() {
  const state = useContext(NavToggleContext)
  if (!state) return null

  return (
    <IconButton
      testID="nav-drawer-toggle"
      label={state.open ? 'Close navigation' : 'Open navigation'}
      onPress={() => state.onOpenChange(!state.open)}
    >
      {/* A bare string here is a text node inside a View, which React Native
          rejects — every glyph has to be wrapped. */}
      <Text>☰</Text>
    </IconButton>
  )
}
