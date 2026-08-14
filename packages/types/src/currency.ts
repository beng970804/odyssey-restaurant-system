/**
 * The currencies Settings may choose from. A closed list because the value is
 * fed to Intl.NumberFormat at every money call site — an arbitrary three-letter
 * string like "XXX" formats, but as nonsense nobody chose.
 */
export const SUPPORTED_CURRENCIES = [
  'SGD',
  'MYR',
  'IDR',
  'THB',
  'PHP',
  'VND',
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'JPY',
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
