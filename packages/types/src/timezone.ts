/**
 * The timezones Settings may choose from. Closed for the same reason
 * SUPPORTED_CURRENCIES is: the value feeds Intl on every opening-hours check,
 * and a near-miss like "Asia/Singapor" would refuse orders all day with
 * nothing on screen to explain why.
 */
export const SUPPORTED_TIMEZONES = ['Asia/Singapore', 'Europe/Paris'] as const

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number]
