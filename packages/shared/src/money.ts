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

/**
 * The inbound half of the money boundary: a dollar string a human typed becomes
 * integer cents. Kept beside `formatMoney` so both directions of the conversion
 * live in one file and neither leaks into a form component.
 *
 * Returns `null` rather than `NaN` or `0` for unparseable input — a form has to
 * distinguish "not a number" from "free", and a silent `0` prices an item at
 * nothing.
 */
export function dollarInputToCents(input: string): number | null {
  const trimmed = input.trim()
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === '' || trimmed === '.') return null

  const [dollars = '', decimals = ''] = trimmed.split('.')
  // String surgery rather than `value * 100`: 8.85 * 100 is 884.99999999999989,
  // and money that rounds is money that is wrong.
  const cents = `${decimals}00`.slice(0, 2)
  return Number(dollars || '0') * 100 + Number(cents)
}

/** Cents as the editable dollar string a text input holds — no currency symbol. */
export function centsToDollarInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function calcTaxCents(subtotalCents: number, ratePercent: number): number {
  return Math.round((subtotalCents * ratePercent) / 100)
}

export function sumCents(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
