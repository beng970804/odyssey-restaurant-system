import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { Slot } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

/**
 * Providers, outermost first: theme, then data, then feedback. The gesture root
 * sits outside all of them — it is a host container, not a provider, and every
 * gesture in the tree has to be inside it.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ApiProvider>
          <ToastProvider>
            <Slot />
          </ToastProvider>
        </ApiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
