import { getGetSettingsQueryKey, unwrap, useGetSettings, useUpdateSettings } from '@repo/api-client'
import type { OpeningHours } from '@repo/shared'
import type { SupportedCurrency, SupportedTimezone } from '@repo/types'
import { useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

export type SettingsDraft = {
  defaultPrepTimeMinutes: number
  autoAcceptOrders: boolean
  dineInEnabled: boolean
  takeawayEnabled: boolean
  deliveryEnabled: boolean
  deliveryFeeCents: number
  taxRatePercent: number
  currency: SupportedCurrency
  timezone: SupportedTimezone
  openingHours: OpeningHours
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** Mirrors the server's rules, so the user hears about a bad time immediately. */
export function validate(draft: SettingsDraft): string | null {
  if (draft.taxRatePercent < 0 || draft.taxRatePercent > 100) return 'Tax rate must be 0–100%'
  if (draft.deliveryFeeCents < 0) return 'Delivery fee cannot be negative'
  if (draft.defaultPrepTimeMinutes <= 0) return 'Prep time must be at least a minute'

  for (const [day, hours] of Object.entries(draft.openingHours)) {
    if (hours.closed) continue
    if (!TIME_PATTERN.test(hours.open) || !TIME_PATTERN.test(hours.close)) {
      return `${day}: times must look like 18:30`
    }
    if (hours.open >= hours.close) return `${day}: opening time must be before closing time`
  }
  return null
}

export function useSettingsForm() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data, isLoading, error, refetch } = useGetSettings()
  const loaded = unwrap(data)

  const [draft, setDraft] = useState<SettingsDraft | null>(null)

  useEffect(() => {
    if (!loaded) return
    setDraft({
      defaultPrepTimeMinutes: loaded.defaultPrepTimeMinutes,
      autoAcceptOrders: loaded.autoAcceptOrders,
      dineInEnabled: loaded.dineInEnabled,
      takeawayEnabled: loaded.takeawayEnabled,
      deliveryEnabled: loaded.deliveryEnabled,
      deliveryFeeCents: loaded.deliveryFeeCents,
      taxRatePercent: loaded.taxRatePercent,
      // The response model types it as string; the allowlist is enforced
      // server-side, so a stored value is always one of ours.
      currency: loaded.currency as SupportedCurrency,
      timezone: loaded.timezone as SupportedTimezone,
      openingHours: loaded.openingHours as OpeningHours,
    })
  }, [loaded])

  const update = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() })
        toast.show('Settings saved', 'success')
      },
      onError: () => toast.show('Could not save settings', 'danger'),
    },
  })

  const isDirty = useMemo(() => {
    if (!draft || !loaded) return false
    return (
      JSON.stringify(draft) !==
      JSON.stringify({
        defaultPrepTimeMinutes: loaded.defaultPrepTimeMinutes,
        autoAcceptOrders: loaded.autoAcceptOrders,
        dineInEnabled: loaded.dineInEnabled,
        takeawayEnabled: loaded.takeawayEnabled,
        deliveryEnabled: loaded.deliveryEnabled,
        deliveryFeeCents: loaded.deliveryFeeCents,
        taxRatePercent: loaded.taxRatePercent,
        currency: loaded.currency,
        timezone: loaded.timezone,
        openingHours: loaded.openingHours,
      })
    )
  }, [draft, loaded])

  const validationError = draft ? validate(draft) : null

  return {
    draft,
    isLoading,
    error: error as unknown as Error | null,
    refetch,
    isDirty,
    validationError,
    isSaving: update.isPending,
    set: <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) =>
      setDraft((current) => (current ? { ...current, [key]: value } : current)),
    save: (options?: { onSaved?: () => void }) => {
      if (!draft || validationError) return
      // The per-call onSuccess runs after the hook's own (invalidate, toast),
      // so a caller can navigate away only once the server has the changes.
      update.mutate({ data: draft }, { onSuccess: options?.onSaved })
    },
    discard: () => {
      if (!loaded) return
      setDraft({
        defaultPrepTimeMinutes: loaded.defaultPrepTimeMinutes,
        autoAcceptOrders: loaded.autoAcceptOrders,
        dineInEnabled: loaded.dineInEnabled,
        takeawayEnabled: loaded.takeawayEnabled,
        deliveryEnabled: loaded.deliveryEnabled,
        deliveryFeeCents: loaded.deliveryFeeCents,
        taxRatePercent: loaded.taxRatePercent,
        currency: loaded.currency as SupportedCurrency,
        timezone: loaded.timezone as SupportedTimezone,
        openingHours: loaded.openingHours as OpeningHours,
      })
    },
  }
}
