import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  type SupportedCurrency,
  type SupportedTimezone,
} from '@repo/types'
import {
  Button,
  Card,
  ErrorState,
  Field,
  Inline,
  Input,
  Modal,
  Select,
  Skeleton,
  Stack,
  Switch,
  Text,
} from '@repo/ui'
import { useCallback, useState } from 'react'
import { useNavigationGuard } from '../../../src/components/NavigationGuard'
import { PageHeader } from '../../../src/components/PageHeader'
import { OpeningHoursEditor } from '../../../src/features/settings/OpeningHoursEditor'
import { useSettingsForm } from '../../../src/features/settings/useSettingsForm'

export default function SettingsScreen() {
  const form = useSettingsForm()

  // The navigation the shell is holding while the operator decides.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)
  const requestLeave = useCallback((proceed: () => void) => setPendingLeave(() => proceed), [])
  useNavigationGuard(form.isDirty ? requestLeave : null)

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

  const leaveWithoutSaving = () => {
    const proceed = pendingLeave
    setPendingLeave(null)
    form.discard()
    proceed?.()
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="These rules decide what the ordering API accepts."
        actions={
          form.isDirty ? (
            <>
              <Button variant="secondary" onPress={form.discard}>
                Discard
              </Button>
              <Button
                onPress={() => form.save()}
                disabled={Boolean(form.validationError)}
                loading={form.isSaving}
              >
                Save changes
              </Button>
            </>
          ) : null
        }
      />

      <Stack gap="xl">
        {form.isDirty ? (
          <Text color={form.validationError ? 'primary' : 'muted'}>
            {form.validationError ?? 'You have unsaved changes.'}
          </Text>
        ) : null}
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
            <Inline gap="xl" wrap>
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
            </Inline>
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
            {/* A closed list — the server rejects anything outside it, and a
                typo like "XXX" would format as nonsense at every price. */}
            <Select
              options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
              value={draft.currency}
              onChange={(value) => set('currency', value as SupportedCurrency)}
            />
          </Field>
          <Field label="Timezone" hint="Decides when the restaurant counts as open">
            {/* Closed for the same reason as currency: a typed near-miss like
                "Asia/Singapor" resolves nowhere and silently breaks the
                opening-hours check. */}
            <Select
              options={SUPPORTED_TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
              value={draft.timezone}
              onChange={(value) => set('timezone', value as SupportedTimezone)}
            />
          </Field>
        </Section>
      </Stack>

      {/* The shell holds the navigation until one of these three answers it. */}
      <Modal
        open={pendingLeave !== null}
        onClose={() => setPendingLeave(null)}
        title="Unsaved changes"
        width={440}
      >
        <Stack gap="lg">
          <Text color="muted">
            {form.validationError
              ? `These changes cannot be saved yet: ${form.validationError}`
              : 'Save your changes before leaving, or they will be lost.'}
          </Text>
          <Inline gap="sm" justify="flex-end" wrap>
            <Button variant="ghost" onPress={() => setPendingLeave(null)}>
              Keep editing
            </Button>
            <Button variant="secondary" onPress={leaveWithoutSaving}>
              Discard changes
            </Button>
            <Button
              onPress={() => form.save({ onSaved: () => pendingLeave?.() })}
              disabled={Boolean(form.validationError)}
              loading={form.isSaving}
            >
              Save and leave
            </Button>
          </Inline>
        </Stack>
      </Modal>
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
