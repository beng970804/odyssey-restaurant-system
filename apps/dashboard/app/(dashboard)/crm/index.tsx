import { unwrap, useGetSettings, useListCustomers } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { Button, EmptyState, SearchInput, Stack, Table, Text, type Column } from '@repo/ui'
import { useEffect, useState } from 'react'
import { PageHeader } from '../../../src/components/PageHeader'
import { CustomerDetailDrawer } from '../../../src/features/crm/CustomerDetailDrawer'
import { CustomerFormModal } from '../../../src/features/crm/CustomerFormModal'

type CustomerRow = {
  id: string
  name: string
  phone: string | null
  orderCount: number
  lifetimeSpendCents: number
}

export default function CrmScreen() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const currency = unwrap(useGetSettings().data)?.currency ?? 'SGD'
  const { data, isLoading, error, refetch } = useListCustomers({
    ...(search && { search }),
    pageSize: 100,
  })
  const rows = (unwrap(data)?.data ?? []) as CustomerRow[]

  const columns: Column<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => <Text variant="bodyStrong">{row.name}</Text>,
    },
    {
      key: 'phone',
      header: 'Phone',
      width: 160,
      render: (row) => <Text color="muted">{row.phone ?? '—'}</Text>,
    },
    {
      key: 'orders',
      header: 'Orders',
      width: 90,
      align: 'right',
      render: (row) => <Text>{String(row.orderCount)}</Text>,
    },
    {
      key: 'spend',
      header: 'Lifetime spend',
      width: 150,
      align: 'right',
      render: (row) => (
        <Text variant="bodyStrong">{formatMoney(row.lifetimeSpendCents, currency)}</Text>
      ),
    },
  ]

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

        <Table
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          error={error as unknown as Error | null}
          onRetry={refetch}
          onRowPress={(row) => setOpenId(row.id)}
          emptyState={
            <EmptyState
              title={search ? 'No customers match that search' : 'No customers yet'}
              description={search ? undefined : 'Walk-ins do not create customers automatically.'}
              action={<Button onPress={() => setCreating(true)}>Add customer</Button>}
            />
          }
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
