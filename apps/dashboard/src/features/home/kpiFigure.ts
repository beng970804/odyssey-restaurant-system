import { formatMoney } from '@repo/shared'

/**
 * What a KPI card counts to.
 *
 * Money and counts are both numbers on screen and nothing alike underneath, so
 * the type says which it is holding. That is what keeps the `Cents` suffix on
 * the money — `{ amount: number }` for both would have put revenue in a field
 * whose name promises nothing, which the constraints forbid: "any variable,
 * column, field or parameter holding money is named with a `Cents` suffix".
 */
export type KpiFigure = { kind: 'count'; total: number } | { kind: 'money'; totalCents: number }

export const countFigure = (total: number): KpiFigure => ({ kind: 'count', total })
export const moneyFigure = (totalCents: number): KpiFigure => ({ kind: 'money', totalCents })

/** The number a count-up climbs towards. */
export const figureTotal = (figure: KpiFigure) =>
  figure.kind === 'money' ? figure.totalCents : figure.total

/**
 * The display boundary, and the only place either kind becomes a string.
 *
 * `at` is where the count-up has reached, which is a fraction between frames —
 * so it is rounded here rather than at each call site. A tween is an animation
 * value; cents are whole, and they become whole again before anyone reads them.
 */
export function formatFigure(figure: KpiFigure, at: number, currency: string): string {
  const whole = Math.round(at)
  return figure.kind === 'money' ? formatMoney(whole, currency) : String(whole)
}
