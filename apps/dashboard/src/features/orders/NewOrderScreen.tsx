import {
  ApiError,
  getGetStatsSummaryQueryKey,
  getListOrdersQueryKey,
  unwrap,
  useCreateOrder,
  useGetSettings,
  useListCategories,
  useListCustomers,
  useListMenuItems,
} from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_CHANNELS } from '@repo/types'
import {
  Button,
  Card,
  Drawer,
  Grid,
  GridItem,
  Inline,
  SearchInput,
  Stack,
  Surface,
  Text,
  useBreakpoint,
  useTheme,
  useToast,
} from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { PageHeader } from '../../components/PageHeader'
import { ALL_CATEGORIES, CategoryFilter } from '../menu/CategoryFilter'
import { CHANNEL_LABELS } from './formatting'
import { MenuPickCard } from './MenuPickCard'
import { OrderSummaryPanel } from './OrderSummaryPanel'
import { useNewOrderForm } from './useNewOrderForm'

type UnavailableDetail = { unavailableItems?: { id: string; name: string }[] }

const SUMMARY_WIDTH = 360

/**
 * The POS layout: the menu owns the screen, the order rides beside it. Wide
 * screens pin the summary as a sidebar; compact ones swap it for a bottom bar
 * that opens the same panel in a drawer. Replaces the old NewOrderModal —
 * a modal's width made picking from a real menu a scrolling chore.
 */
export function NewOrderScreen() {
  const theme = useTheme()
  const toast = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isCompact } = useBreakpoint()

  const settings = unwrap(useGetSettings().data)
  // Unavailable items are fetched and shown dimmed — hidden, staff would think
  // the dish left the menu. Archived ones are genuinely gone.
  const menu = unwrap(useListMenuItems({ pageSize: 100 }).data)
  const categories = unwrap(useListCategories().data)?.data ?? []
  const customers = unwrap(useListCustomers({ pageSize: 100 }).data)

  // Only channels Settings has switched on — the server would refuse the rest.
  const enabledChannels = ORDER_CHANNELS.filter((channel) =>
    settings
      ? {
          dine_in: settings.dineInEnabled,
          takeaway: settings.takeawayEnabled,
          delivery: settings.deliveryEnabled,
        }[channel]
      : true,
  )

  const form = useNewOrderForm({
    settings: {
      taxRatePercent: settings?.taxRatePercent ?? 9,
      deliveryFeeCents: settings?.deliveryFeeCents ?? 0,
    },
    enabledChannels,
  })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [reviewing, setReviewing] = useState(false)
  const [rejectedItemIds, setRejectedItemIds] = useState<string[]>([])
  const [channelError, setChannelError] = useState<string | null>(null)

  const currency = settings?.currency ?? 'SGD'

  const channelOptions = enabledChannels.map((value) => ({
    value,
    label: CHANNEL_LABELS[value] ?? value,
  }))

  const customerOptions = (customers?.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (menu?.data ?? [])
      .filter((item) => category === ALL_CATEGORIES || item.categoryId === category)
      .filter((item) => !needle || item.name.toLowerCase().includes(needle))
  }, [menu, search, category])

  const quantities = useMemo(
    () => new Map(form.lines.map((line) => [line.item.id, line.quantity])),
    [form.lines],
  )

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (response) => {
        const order = response.data as { orderNumber: number; totalCents: number }
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() })
        toast.show(
          `Order #${order.orderNumber} placed — ${formatMoney(order.totalCents, currency)}`,
          'success',
        )
        // Replace, not back: back would return here with an emptied form and
        // read as "my order vanished".
        router.replace('/orders')
      },
      onError: (error: unknown) => {
        if (!(error instanceof ApiError)) {
          toast.show('Something went wrong', 'danger')
          return
        }
        // The payoff for putting code and details in the error envelope: the
        // offending lines are highlighted rather than a generic toast shown.
        if (error.code === 'ITEM_UNAVAILABLE') {
          const details = error.details as UnavailableDetail | undefined
          setRejectedItemIds((details?.unavailableItems ?? []).map((item) => item.id))
          toast.show('Some items are no longer available', 'warning')
          return
        }
        if (error.code === 'CHANNEL_DISABLED' || error.code === 'OUTSIDE_OPENING_HOURS') {
          setChannelError(error.message)
          // The channel field lives in the summary; make sure it is on screen.
          setReviewing(true)
          return
        }
        toast.show(error.message, 'danger')
      },
    },
  })

  const submit = () => {
    setRejectedItemIds([])
    setChannelError(null)
    createOrder.mutate({ data: form.payload })
  }

  const summary = (
    <OrderSummaryPanel
      form={form}
      currency={currency}
      channelOptions={channelOptions}
      customerOptions={customerOptions}
      rejectedItemIds={rejectedItemIds}
      channelError={channelError}
      submitting={createOrder.isPending}
      onSubmit={submit}
    />
  )

  const picker = (
    <Stack gap="md" flex={1}>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search menu" />
      <CategoryFilter categories={categories} value={category} onChange={setCategory} />
      <Grid gap="md" columns={4}>
        {visibleItems.map((item) => (
          <GridItem key={item.id}>
            <MenuPickCard
              item={item}
              quantity={quantities.get(item.id) ?? 0}
              currency={currency}
              onAdd={form.addItem}
              onSetQuantity={form.setQuantity}
            />
          </GridItem>
        ))}
      </Grid>
      {visibleItems.length === 0 ? (
        <Text color="muted">No dishes match. Try another search or category.</Text>
      ) : null}
    </Stack>
  )

  return (
    <>
      <PageHeader
        title="New order"
        description="Pick from the menu; the order builds beside it."
        actions={
          <Button variant="secondary" onPress={() => router.back()}>
            Cancel
          </Button>
        }
      />

      {isCompact ? (
        <>
          {picker}
          {/* The bar restates the order so the operator never opens the drawer
              just to check the total. */}
          <Surface
            bordered
            padding="md"
            radius="md"
            style={{ position: 'sticky' as never, bottom: theme.space.md }}
          >
            <Inline justify="space-between" align="center">
              <Text variant="bodyStrong">
                {`${String(form.lines.length)} item${form.lines.length === 1 ? '' : 's'} · ${formatMoney(form.estimate.totalCents, currency)}`}
              </Text>
              <Button onPress={() => setReviewing(true)} disabled={!form.isValid}>
                Review order
              </Button>
            </Inline>
          </Surface>
          <Drawer open={reviewing} onClose={() => setReviewing(false)} title="Order summary">
            {summary}
          </Drawer>
        </>
      ) : (
        <Inline gap="lg" align="flex-start">
          {picker}
          {/* No scroller of its own: the page already scrolls, and a nested one
              clips the focus rings off the panel's own controls. */}
          <View style={{ width: SUMMARY_WIDTH }}>
            <Card padding="lg">{summary}</Card>
          </View>
        </Inline>
      )}
    </>
  )
}
