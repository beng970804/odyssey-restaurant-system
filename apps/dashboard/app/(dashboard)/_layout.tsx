import { Slot } from 'expo-router'
import { AppShell } from '../../src/components/AppShell'
import { NavigationGuardProvider } from '../../src/components/NavigationGuard'
import { usePendingOrderCount } from '../../src/features/orders/useOrders'

export default function DashboardLayout() {
  const pendingCount = usePendingOrderCount()

  return (
    // Above the shell, so the sidebar's navigation and the screens' guards
    // share one context.
    <NavigationGuardProvider>
      <AppShell pendingCount={pendingCount}>{<Slot />}</AppShell>
    </NavigationGuardProvider>
  )
}
