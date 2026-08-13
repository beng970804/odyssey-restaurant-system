import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ApiError } from './fetcher'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 404 or a rejected transition will not become true on retry, so
        // retrying a 4xx only delays the error state the screen wants to show.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false
          return failureCount < 2
        },
      },
      // Never retry a mutation: silently repeating "create order" would place
      // two orders.
      mutations: { retry: 0 },
    },
  })
}

export function ApiProvider({ children }: { children: ReactNode }) {
  // useState, not a module-level client: one client per mounted tree, created
  // once, so a remount does not share cache across app instances.
  const [client] = useState(createQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
