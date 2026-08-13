import { Slot } from 'expo-router'
import { AppShell } from '../../src/components/AppShell'
import { usePendingOrderCount } from '../../src/features/orders/useOrders'

export default function DashboardLayout() {
  const pendingCount = usePendingOrderCount()

  return <AppShell pendingCount={pendingCount}>{<Slot />}</AppShell>
}
