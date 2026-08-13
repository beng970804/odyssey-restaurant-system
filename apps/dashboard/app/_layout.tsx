import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { Slot } from 'expo-router'

/** Providers, outermost first: theme, then data, then feedback. */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>
          <Slot />
        </ToastProvider>
      </ApiProvider>
    </ThemeProvider>
  )
}
