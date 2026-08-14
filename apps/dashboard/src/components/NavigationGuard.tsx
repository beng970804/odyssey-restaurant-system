import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

/**
 * Asked before the shell navigates away; owns the decision. It shows whatever
 * UI it wants and calls `proceed` if and when leaving is allowed.
 */
export type NavigationGuard = (proceed: () => void) => void

type GuardContextValue = {
  set: (guard: NavigationGuard | null) => void
  guarded: (action: () => void) => void
}

const GuardContext = createContext<GuardContextValue | null>(null)

/**
 * The dashboard has no stack navigator to intercept — routes swap inside a
 * Slot — so "are you sure?" has to happen before router.push, not after.
 * The shell routes its navigation through here; a screen with something to
 * lose registers a guard, and everything else costs nothing.
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  // A ref, not state: registering a guard must not re-render the shell.
  const guardRef = useRef<NavigationGuard | null>(null)

  const value = useMemo<GuardContextValue>(
    () => ({
      set: (guard) => {
        guardRef.current = guard
      },
      guarded: (action) => {
        const guard = guardRef.current
        if (guard) guard(action)
        else action()
      },
    }),
    [],
  )

  return <GuardContext.Provider value={value}>{children}</GuardContext.Provider>
}

/** How the shell navigates: the action runs now, or when the guard releases it. */
export function useGuardedNavigation(): (action: () => void) => void {
  const context = useContext(GuardContext)
  // Without a provider (tests, previews) navigation is simply unguarded.
  return context?.guarded ?? ((action) => action())
}

/** Registers `guard` while mounted and non-null; pass null when there is nothing to lose. */
export function useNavigationGuard(guard: NavigationGuard | null): void {
  const context = useContext(GuardContext)
  const set = context?.set

  useEffect(() => {
    if (!set) return
    set(guard)
    return () => set(null)
  }, [set, guard])
}
