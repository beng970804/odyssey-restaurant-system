import { useContext } from 'react'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'

/** A browser gives the page the whole viewport; only a phone withholds edges. */
const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 }

/**
 * The safe-area insets, or zero where nobody is withholding any.
 *
 * Read through the context with a fallback rather than the library's hook,
 * which throws where no provider is mounted. The app gets a provider from
 * expo-router; a browser, a jsdom test and a bare render do not — and in all
 * three, "no provider" and "no notch" are the same fact.
 */
export function useScreenInsets() {
  return useContext(SafeAreaInsetsContext) ?? NO_INSETS
}
