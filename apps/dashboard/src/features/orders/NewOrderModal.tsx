import {
  ApiError,
  getGetStatsSummaryQueryKey,
  getListOrdersQueryKey,
  unwrap,
  useCreateOrder,
  useGetSettings,
  useListCustomers,
  useListMenuItems,
} from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import { ORDER_CHANNELS, type OrderChannel } from '@repo/types'
import {
  Badge,
  Button,
  Divider,
  Field,
  IconButton,
  Inline,
  Modal,
  SearchInput,
  Select,
  Stack,
  Surface,
  Text,
  Textarea,
  useTheme,
  useToast,
} from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { CHANNEL_LABELS } from './formatting'
import { useNewOrderForm } from './useNewOrderForm'

type UnavailableDetail = { unavailableItems?: { id: string; name: string }[] }

export function NewOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme()
  const toast = useToast()
  const queryClient = useQueryClient()

  const settings = unwrap(useGetSettings().data)
  const menu = unwrap(useListMenuItems({ available: 'true', pageSize: 100 }).data)
  const customers = unwrap(useListCustomers({ pageSize: 100 }).data)

  const form = useNewOrderForm({
    settings: {
      taxRatePercent: settings?.taxRatePercent ?? 9,
      deliveryFeeCents: settings?.deliveryFeeCents ?? 0,
    },
  })

  const [search, setSearch] = useState('')
  const [rejectedItemIds, setRejectedItemIds] = useState<string[]>([])
  const [channelError, setChannelError] = useState<string | null>(null)

  const currency = settings?.currency ?? 'SGD'

  // Only channels Settings has switched on — the server would refuse the rest.
  const channelOptions = ORDER_CHANNELS.filter((channel) =>
    settings
      ? {
          dine_in: settings.dineInEnabled,
          takeaway: settings.takeawayEnabled,
          delivery: settings.deliveryEnabled,
        }[channel]
      : true,
  ).map((value) => ({ value, label: CHANNEL_LABELS[value] ?? value }))

  const visibleItems = useMemo(() => {
    const items = menu?.data ?? []
    const needle = search.trim().toLowerCase()
    return needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items
  }, [menu, search])

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
        form.reset()
        onClose()
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New order"
      width={880}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            onPress={submit}
            disabled={!form.isValid}
            // Disabled while pending: a second click would be a second order.
            loading={createOrder.isPending}
          >
            {`Place order · ${formatMoney(form.estimate.totalCents, currency)}`}
          </Button>
        </>
      }
    >
      <Inline gap="md" wrap align="flex-start">
        <View style={{ flex: 1, minWidth: 220, zIndex: 20 }}>
          <Field label="Channel" error={channelError ?? undefined}>
            <Select
              options={channelOptions}
              value={form.channel}
              onChange={(value) => form.setChannel(value as OrderChannel)}
            />
          </Field>
        </View>
        <View style={{ flex: 1, minWidth: 220, zIndex: 10 }}>
          <Field label="Customer" hint="Leave empty for a walk-in">
            <Select
              options={(customers?.data ?? []).map((customer) => ({
                value: customer.id,
                label: customer.name,
              }))}
              value={form.customerId}
              onChange={form.setCustomerId}
              onClear={() => form.setCustomerId(null)}
              placeholder="Walk-in"
            />
          </Field>
        </View>
      </Inline>

      <Inline gap="lg" align="flex-start" wrap>
        <Stack gap="sm" flex={1} style={{ minWidth: 300 }}>
          <Text variant="bodyStrong">Menu</Text>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Search items" />
          <ScrollView style={{ maxHeight: 280 }}>
            <Stack gap="xs">
              {visibleItems.map((item) => (
                <Surface key={item.id} bordered padding="sm" radius="md">
                  <Inline justify="space-between">
                    <Stack gap="xs" flex={1}>
                      <Text>{item.name}</Text>
                      <Text variant="caption" color="muted">
                        {`${item.categoryName} · ${formatMoney(item.priceCents, currency)}`}
                      </Text>
                    </Stack>
                    <Button size="sm" variant="secondary" onPress={() => form.addItem(item)}>
                      Add
                    </Button>
                  </Inline>
                </Surface>
              ))}
            </Stack>
          </ScrollView>
        </Stack>

        <Stack gap="sm" flex={1} style={{ minWidth: 300 }}>
          <Text variant="bodyStrong">Order</Text>
          {form.lines.length === 0 ? (
            <Text color="muted">Nothing added yet.</Text>
          ) : (
            <Stack gap="xs">
              {form.lines.map((line) => (
                <Surface
                  key={line.item.id}
                  bordered
                  padding="sm"
                  radius="md"
                  style={
                    rejectedItemIds.includes(line.item.id)
                      ? { borderColor: theme.color.status.danger.fg }
                      : undefined
                  }
                >
                  <Stack gap="xs">
                    <Inline justify="space-between">
                      <Text style={{ flex: 1 }}>{line.item.name}</Text>
                      <Inline gap="xs">
                        <IconButton
                          label={`Remove one ${line.item.name}`}
                          size="sm"
                          onPress={() => form.setQuantity(line.item.id, line.quantity - 1)}
                        >
                          <Text>−</Text>
                        </IconButton>
                        <Text variant="bodyStrong">{String(line.quantity)}</Text>
                        <IconButton
                          label={`Add one ${line.item.name}`}
                          size="sm"
                          onPress={() => form.setQuantity(line.item.id, line.quantity + 1)}
                        >
                          <Text>+</Text>
                        </IconButton>
                        <Text>{formatMoney(line.item.priceCents * line.quantity, currency)}</Text>
                      </Inline>
                    </Inline>
                    {rejectedItemIds.includes(line.item.id) ? (
                      <Text variant="caption" style={{ color: theme.color.status.danger.fg }}>
                        No longer available
                      </Text>
                    ) : null}
                  </Stack>
                </Surface>
              ))}
            </Stack>
          )}

          <Field label="Order notes">
            <Textarea
              value={form.notes}
              onChangeText={form.setNotes}
              placeholder="Allergies, delivery instructions"
            />
          </Field>

          <Divider />
          <EstimateLine
            label="Subtotal"
            value={formatMoney(form.estimate.subtotalCents, currency)}
          />
          <EstimateLine label="Tax" value={formatMoney(form.estimate.taxCents, currency)} />
          {form.estimate.deliveryFeeCents > 0 ? (
            <EstimateLine
              label="Delivery"
              value={formatMoney(form.estimate.deliveryFeeCents, currency)}
            />
          ) : null}
          <Inline justify="space-between">
            <Text variant="bodyStrong">Estimated total</Text>
            <Badge tone="info">{formatMoney(form.estimate.totalCents, currency)}</Badge>
          </Inline>
        </Stack>
      </Inline>
    </Modal>
  )
}

function EstimateLine({ label, value }: { label: string; value: string }) {
  return (
    <Inline justify="space-between">
      <Text color="muted">{label}</Text>
      <Text>{value}</Text>
    </Inline>
  )
}
