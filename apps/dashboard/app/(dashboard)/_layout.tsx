import { unwrap, useListOrders } from '@repo/api-client'
import { Slot } from 'expo-router'
import { AppShell } from '../../src/components/AppShell'

export default function DashboardLayout() {
  // The badge is the one piece of data the shell itself needs.
  const { data } = useListOrders({ status: 'pending', pageSize: 1 })

  return <AppShell pendingCount={unwrap(data)?.meta.total}>{<Slot />}</AppShell>
}
