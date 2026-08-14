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

const SENTINEL_STATE = { navigationGuardSentinel: true }

/**
 * The dashboard has no stack navigator to intercept — routes swap inside a
 * Slot — so "are you sure?" has to happen before router.push, not after.
 * The shell routes its navigation through here; a screen with something to
 * lose registers a guard, and everything else costs nothing.
 *
 * The browser's own back button never asks the router first, so while a guard
 * is registered a sentinel entry is pushed onto the history. A back press
 * consumes the sentinel instead of the page — the URL stays put, the guard is
 * asked, and leaving steps back past both entries. Tab close and refresh get
 * the browser's native beforeunload prompt. On native there is no history and
 * this whole layer stays inert.
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  // Refs, not state: registering a guard must not re-render the shell.
  const guardRef = useRef<NavigationGuard | null>(null)
  const armedRef = useRef(false)
  // Set when we pop our own sentinel on purpose; runs once the pop lands.
  const afterPopRef = useRef<(() => void) | null>(null)
  // True while walking back out through the sentinels after "leave" was chosen.
  const leavingRef = useRef(false)

  const historyAvailable =
    typeof window !== 'undefined' && typeof window.history?.pushState === 'function'

  useEffect(() => {
    if (!historyAvailable) return

    const isSentinel = () =>
      Boolean(
        (window.history.state as { navigationGuardSentinel?: boolean } | null)
          ?.navigationGuardSentinel,
      )

    const onPopState = () => {
      // Walking out: step past every sentinel, then once past the page itself.
      // Counted steps would need to know how many spent sentinels the browser
      // kept, and engines disagree — so each entry is inspected instead.
      if (leavingRef.current) {
        if (!isSentinel()) leavingRef.current = false
        window.history.back()
        return
      }
      const afterPop = afterPopRef.current
      if (afterPop) {
        afterPopRef.current = null
        afterPop()
        return
      }
      const guard = guardRef.current
      if (!armedRef.current || !guard) return
      // The back press consumed the sentinel and the URL did not change, so
      // the router saw nothing. Stand the sentinel back up and ask. The push
      // waits a task: during popstate dispatch the traversal has not committed
      // in every engine, and pushing too early corrupts the stack.
      setTimeout(() => window.history.pushState(SENTINEL_STATE, '', window.location.href), 0)
      guard(() => {
        armedRef.current = false
        if (isSentinel()) {
          // Standing on a sentinel: let the popstate cascade walk out.
          leavingRef.current = true
          window.history.back()
        } else {
          // Already on the page's own entry: one step reaches the destination.
          window.history.back()
        }
      })
    }

    const onBeforeUnload = (event: Event) => {
      if (!armedRef.current || !guardRef.current) return
      // No dialog of ours can survive the unload; the browser's generic
      // "leave site?" prompt is the only available ask.
      event.preventDefault()
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [historyAvailable])

  const value = useMemo<GuardContextValue>(() => {
    const arm = () => {
      if (!historyAvailable || armedRef.current) return
      window.history.pushState(SENTINEL_STATE, '', window.location.href)
      armedRef.current = true
    }

    /** Drops the sentinel we are standing on, then runs `then` once it has. */
    const collapse = (then?: () => void) => {
      if (!historyAvailable || !armedRef.current) {
        then?.()
        return
      }
      armedRef.current = false
      if (then) afterPopRef.current = then
      window.history.back()
    }

    return {
      set: (guard) => {
        guardRef.current = guard
        if (guard) arm()
        else collapse()
      },
      guarded: (action) => {
        const guard = guardRef.current
        if (!guard) {
          action()
          return
        }
        // Collapse before navigating, so the new entry stacks on the real one
        // and a later back press is one press, not two.
        guard(() => collapse(action))
      },
    }
  }, [historyAvailable])

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
