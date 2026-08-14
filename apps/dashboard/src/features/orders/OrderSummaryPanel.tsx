import { formatMoney } from '@repo/shared'
import type { OrderChannel } from '@repo/types'
import {
  Button,
  Divider,
  Field,
  IconButton,
  Inline,
  Select,
  Stack,
  Surface,
  Text,
  Textarea,
  useTheme,
} from '@repo/ui'
import type { useNewOrderForm } from './useNewOrderForm'

type Option = { value: string; label: string }

export type OrderSummaryPanelProps = {
  form: ReturnType<typeof useNewOrderForm>
  currency: string
  channelOptions: Option[]
  customerOptions: Option[]
  /** Lines the server refused as unavailable, flagged in place. */
  rejectedItemIds: string[]
  /** CHANNEL_DISABLED / OUTSIDE_OPENING_HOURS, rendered against the channel field. */
  channelError: string | null
  submitting: boolean
  onSubmit: () => void
}

/**
 * The right-hand half of the new-order screen: what the order *is*, while the
 * menu grid beside it is what the order could be. Extracted so the wide layout
 * can pin it as a sidebar and the compact one can put the same panel in a
 * drawer — one implementation, two placements.
 */
export function OrderSummaryPanel({
  form,
  currency,
  channelOptions,
  customerOptions,
  rejectedItemIds,
  channelError,
  submitting,
  onSubmit,
}: OrderSummaryPanelProps) {
  const theme = useTheme()

  return (
    <Stack gap="md">
      <Field label="Channel" error={channelError ?? undefined}>
        <Select
          options={channelOptions}
          value={form.channel}
          onChange={(value) => form.setChannel(value as OrderChannel)}
        />
      </Field>

      <Field label="Customer" hint="Leave empty for a walk-in">
        <Select
          options={customerOptions}
          value={form.customerId}
          onChange={form.setCustomerId}
          onClear={() => form.setCustomerId(null)}
          placeholder="Walk-in"
        />
      </Field>

      <Divider />

      <Inline justify="space-between">
        <Text variant="bodyStrong">{`Items (${String(form.lines.length)})`}</Text>
        {form.lines.length > 0 ? (
          <Button variant="ghost" size="sm" onPress={form.reset}>
            Clear
          </Button>
        ) : null}
      </Inline>

      {form.lines.length === 0 ? (
        <Text color="muted">Nothing added yet.</Text>
      ) : (
        <Stack gap="xs">
          {form.lines.map((line) => {
            const rejected = rejectedItemIds.includes(line.item.id)
            return (
              <Surface
                key={line.item.id}
                bordered
                padding="sm"
                radius="md"
                style={rejected ? { borderColor: theme.color.status.danger.fg } : undefined}
              >
                <Stack gap="xs">
                  <Inline justify="space-between" gap="sm">
                    <Text style={{ flex: 1 }} numberOfLines={1}>
                      {line.item.name}
                    </Text>
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
                      <Text style={{ minWidth: 64, textAlign: 'right' }}>
                        {formatMoney(line.item.priceCents * line.quantity, currency)}
                      </Text>
                      <IconButton
                        label={`Remove ${line.item.name}`}
                        size="sm"
                        onPress={() => form.setQuantity(line.item.id, 0)}
                      >
                        <Text color="muted">✕</Text>
                      </IconButton>
                    </Inline>
                  </Inline>
                  {rejected ? (
                    <Text variant="caption" style={{ color: theme.color.status.danger.fg }}>
                      No longer available
                    </Text>
                  ) : null}
                </Stack>
              </Surface>
            )
          })}
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

      <EstimateLine label="Subtotal" value={formatMoney(form.estimate.subtotalCents, currency)} />
      <EstimateLine label="Tax" value={formatMoney(form.estimate.taxCents, currency)} />
      {form.estimate.deliveryFeeCents > 0 ? (
        <EstimateLine
          label="Delivery fee"
          value={formatMoney(form.estimate.deliveryFeeCents, currency)}
        />
      ) : null}

      <Button
        onPress={onSubmit}
        disabled={!form.isValid}
        // Disabled while pending: a second press would be a second order.
        loading={submitting}
      >
        {`Place order · ${formatMoney(form.estimate.totalCents, currency)}`}
      </Button>
    </Stack>
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
