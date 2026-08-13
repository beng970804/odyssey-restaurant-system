import { describe, expect, it } from 'vitest'
import { calcTaxCents, formatMoney, sumCents } from '../src/money'

describe('formatMoney', () => {
  it('formats cents as currency', () => {
    expect(formatMoney(2602, 'SGD')).toBe('S$26.02')
  })
  it('formats zero', () => {
    expect(formatMoney(0, 'SGD')).toBe('S$0.00')
  })
})

describe('calcTaxCents', () => {
  it('rounds to the nearest cent', () => {
    // 2020 * 0.09 = 181.8 -> 182 (the spec's worked example)
    expect(calcTaxCents(2020, 9)).toBe(182)
  })
  it('rounds half up', () => {
    expect(calcTaxCents(1000, 5)).toBe(50)
    expect(calcTaxCents(50, 9)).toBe(5) // 4.5 -> 5
  })
  it('returns zero for a zero rate', () => {
    expect(calcTaxCents(2020, 0)).toBe(0)
  })
})

describe('sumCents', () => {
  it('sums a list', () => {
    expect(sumCents([1700, 320])).toBe(2020)
  })
})
