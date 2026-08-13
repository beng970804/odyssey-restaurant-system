import {
  Button,
  Card,
  ErrorState,
  Field,
  Inline,
  Input,
  Skeleton,
  Stack,
  Switch,
  Text,
} from '@repo/ui'
import { PageHeader } from '../../../src/components/PageHeader'
import { OpeningHoursEditor } from '../../../src/features/settings/OpeningHoursEditor'
import { useSettingsForm } from '../../../src/features/settings/useSettingsForm'

export default function SettingsScreen() {
  const form = useSettingsForm()

  if (form.error) return <ErrorState error={form.error} onRetry={form.refetch} />
  if (form.isLoading || !form.draft) {
    return (
      <Stack gap="lg">
        <Skeleton height={32} width={200} />
        <Skeleton height={160} />
        <Skeleton height={220} />
      </Stack>
    )
  }

  const { draft, set } = form

  return (
    <>
      <PageHeader
        title="Settings"
        description="These rules decide what the ordering API accepts."
      />

      <Stack gap="xl">
        <Section title="Ordering">
          <Field
            label="Default prep time (minutes)"
            hint="Sets each new order's estimated ready time"
          >
            <Input
              value={String(draft.defaultPrepTimeMinutes)}
              onChangeText={(value) => set('defaultPrepTimeMinutes', Number(value) || 0)}
              keyboardType="number-pad"
            />
          </Field>
          <Stack gap="xs">
            <Switch
              value={draft.autoAcceptOrders}
              onValueChange={(value) => set('autoAcceptOrders', value)}
              label="Auto-accept orders"
            />
            <Text variant="caption" color="muted">
              New orders skip Pending and arrive as Accepted.
            </Text>
          </Stack>
        </Section>

        <Section title="Channels">
          <Stack gap="xs">
            <Switch
              value={draft.dineInEnabled}
              onValueChange={(value) => set('dineInEnabled', value)}
              label="Dine in"
            />
            <Switch
              value={draft.takeawayEnabled}
              onValueChange={(value) => set('takeawayEnabled', value)}
              label="Takeaway"
            />
            <Switch
              value={draft.deliveryEnabled}
              onValueChange={(value) => set('deliveryEnabled', value)}
              label="Delivery"
            />
            <Text variant="caption" color="muted">
              A disabled channel disappears from New Order, and the API refuses it outright.
            </Text>
          </Stack>
          <Field label="Delivery fee (cents)" hint="Charged on delivery orders only">
            <Input
              value={String(draft.deliveryFeeCents)}
              onChangeText={(value) => set('deliveryFeeCents', Number(value) || 0)}
              keyboardType="number-pad"
              disabled={!draft.deliveryEnabled}
            />
          </Field>
        </Section>

        <Section title="Opening hours">
          <Text variant="caption" color="muted">
            Compared in the restaurant&apos;s timezone. Outside these hours the API refuses new
            orders.
          </Text>
          <OpeningHoursEditor
            value={draft.openingHours}
            onChange={(value) => set('openingHours', value)}
          />
        </Section>

        <Section title="Financial">
          <Field label="Tax rate (%)">
            <Input
              value={String(draft.taxRatePercent)}
              onChangeText={(value) => set('taxRatePercent', Number(value) || 0)}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="Currency">
            <Input
              value={draft.currency}
              onChangeText={(value) => set('currency', value.toUpperCase())}
            />
          </Field>
          <Field label="Timezone" hint="An IANA name, e.g. Asia/Singapore">
            <Input value={draft.timezone} onChangeText={(value) => set('timezone', value)} />
          </Field>
        </Section>

        {form.isDirty ? (
          <Card padding="md">
            <Inline justify="space-between" align="center">
              <Text color={form.validationError ? 'primary' : 'muted'}>
                {form.validationError ?? 'You have unsaved changes.'}
              </Text>
              <Inline gap="sm">
                <Button variant="secondary" onPress={form.discard}>
                  Discard
                </Button>
                <Button
                  onPress={form.save}
                  disabled={Boolean(form.validationError)}
                  loading={form.isSaving}
                >
                  Save changes
                </Button>
              </Inline>
            </Inline>
          </Card>
        ) : null}
      </Stack>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card padding="lg">
      <Stack gap="md">
        <Text variant="h3">{title}</Text>
        {children}
      </Stack>
    </Card>
  )
}
