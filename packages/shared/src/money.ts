/**
 * ICU renders SGD in en-SG as a bare "$", which is ambiguous on a dashboard
 * that could as easily be showing USD. The spec calls for "S$26.02", and no
 * locale/currencyDisplay combination produces that, so the currency part is
 * substituted. Everything else — grouping, decimals, sign placement — still
 * comes from Intl.
 */
const CURRENCY_SYMBOL_OVERRIDES = { SGD: 'S$' } as const satisfies Record<string, string>

/**
 * Divides by 100 *only at the display boundary*. This division is the single
 * place a cent value becomes a dollar value in the entire system.
 */
export function formatMoney(cents: number, currency = 'SGD', locale = 'en-SG'): string {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(cents / 100)

  const override: string | undefined =
    CURRENCY_SYMBOL_OVERRIDES[currency as keyof typeof CURRENCY_SYMBOL_OVERRIDES]
  return parts.map((p) => (p.type === 'currency' && override ? override : p.value)).join('')
}

export function calcTaxCents(subtotalCents: number, ratePercent: number): number {
  return Math.round((subtotalCents * ratePercent) / 100)
}

export function sumCents(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
