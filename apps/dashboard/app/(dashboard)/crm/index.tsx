import { Button, SearchInput, Stack } from '@repo/ui'
import { useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { CustomerDetailDrawer } from '../../../src/features/crm/CustomerDetailDrawer'
import { CustomerFormModal } from '../../../src/features/crm/CustomerFormModal'
import { CustomerTable } from '../../../src/features/crm/CustomerTable'
import { useCustomers } from '../../../src/features/crm/useCustomers'
import { useCurrency } from '../../../src/hooks/useCurrency'

export default function CrmScreen() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const currency = useCurrency()
  const {
    searchInput,
    setSearchInput,
    searching,
    customers,
    isLoading,
    refreshing,
    error,
    refetch,
  } = useCustomers()

  return (
    <>
      <PageHeader
        title="Customers"
        description="Sorted by lifetime spend — cancelled orders excluded."
        actions={<Button onPress={() => setCreating(true)}>Add customer</Button>}
      />

      <Stack gap="lg">
        <SearchInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by name"
        />

        <CustomerTable
          customers={customers}
          loading={isLoading}
          refreshing={refreshing}
          error={error}
          onRetry={refetch}
          onRowPress={(customer) => setOpenId(customer.id)}
          onAddCustomer={() => setCreating(true)}
          currency={currency}
          searching={searching}
        />
      </Stack>

      <CustomerDetailDrawer
        customerId={openId}
        onClose={() => setOpenId(null)}
        currency={currency}
      />
      <CustomerFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
