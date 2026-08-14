import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme, useWindowDimensions } from 'react-native'
import { darkTheme } from './dark'
import { lightTheme } from './tokens'
import type { Theme } from './types'

export type ThemeMode = 'light' | 'dark'

type ThemeModeControl = {
  mode: ThemeMode
  /** `null` hands control back to the operating system. */
  setMode: (mode: ThemeMode | null) => void
  isSystem: boolean
}

const ThemeContext = createContext<Theme>(lightTheme)
const ThemeModeContext = createContext<ThemeModeControl>({
  mode: 'light',
  setMode: () => {},
  isSystem: true,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [override, setOverride] = useState<ThemeMode | null>(null)

  const mode: ThemeMode = override ?? (system === 'dark' ? 'dark' : 'light')
  const theme = mode === 'dark' ? darkTheme : lightTheme

  const control = useMemo<ThemeModeControl>(
    () => ({ mode, setMode: setOverride, isSystem: override === null }),
    [mode, override],
  )

  /**
   * The parts of the page the browser paints itself — scrollbars above all —
   * take their colour from `color-scheme`, not from ours. Left unset they stay
   * light, so a dark dashboard gets a bright scrollbar down its edge and a
   * white flash behind every form control.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.style.colorScheme = mode
  }, [mode])

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeModeContext.Provider value={control}>{children}</ThemeModeContext.Provider>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export const useThemeMode = () => useContext(ThemeModeContext)

/**
 * Screens ask `isCompact`; they never compare a raw width against a number.
 * One place decides what "compact" means, and it is the same file that decides
 * how wide the sidebar is.
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions()
  const { breakpoints } = useTheme().layout

  return {
    width,
    isCompact: width < breakpoints.md,
    isWide: width >= breakpoints.lg,
  }
}
