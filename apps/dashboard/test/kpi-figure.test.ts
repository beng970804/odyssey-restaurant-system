import { describe, expect, it } from 'vitest'
import { countFigure, figureTotal, formatFigure, moneyFigure } from '../src/features/home/kpiFigure'

describe('a KPI figure', () => {
  it('keeps money in cents, and says so in the field name', () => {
    // `{ amount: number }` for both kinds put revenue in a field whose name
    // promised nothing. The union is what lets the money one be `totalCents`.
    const money = moneyFigure(381311)
    expect(money).toEqual({ kind: 'money', totalCents: 381311 })
    expect(countFigure(60)).toEqual({ kind: 'count', total: 60 })
  })

  it('formats each kind at the display boundary and nowhere else', () => {
    expect(formatFigure(moneyFigure(381311), 381311, 'SGD')).toBe('S$3,813.11')
    expect(formatFigure(countFigure(60), 60, 'SGD')).toBe('60')
  })

  it('rounds the tween, so fractional cents never reach a formatter', () => {
    // A count-up interpolates between whole cents; halfway to S$26.02 is not a
    // sum of money, and must not be printed as one.
    expect(formatFigure(moneyFigure(2602), 1300.7, 'SGD')).toBe('S$13.01')
    expect(formatFigure(countFigure(60), 41.6, 'SGD')).toBe('42')
  })

  it('reports the number to count towards', () => {
    expect(figureTotal(moneyFigure(2602))).toBe(2602)
    expect(figureTotal(countFigure(60))).toBe(60)
  })
})
