import { describe, expect, it } from 'vitest'
import {
  calcTaxCents,
  centsToDollarInput,
  dollarInputToCents,
  formatMoney,
  sumCents,
} from '../src/money'

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

describe('dollarInputToCents', () => {
  it('multiplies by 100 without float drift', () => {
    expect(dollarInputToCents('8.50')).toBe(850)
    // 8.85 * 100 is 884.9999... in binary floating point; a bare Math.round of
    // the product is not enough on every value, so this pins the family.
    expect(dollarInputToCents('8.85')).toBe(885)
    expect(dollarInputToCents('19.99')).toBe(1999)
  })

  it('accepts a partially typed value', () => {
    expect(dollarInputToCents('8')).toBe(800)
    expect(dollarInputToCents('8.')).toBe(800)
    expect(dollarInputToCents('.5')).toBe(50)
  })

  it('truncates beyond cents rather than rounding a third decimal into money', () => {
    expect(dollarInputToCents('8.509')).toBe(850)
  })

  it('returns null for anything that is not a number, so the field can say so', () => {
    expect(dollarInputToCents('')).toBeNull()
    expect(dollarInputToCents('abc')).toBeNull()
    expect(dollarInputToCents('-')).toBeNull()
  })
})

describe('centsToDollarInput', () => {
  it('renders an editable dollar string, not a formatted currency', () => {
    expect(centsToDollarInput(850)).toBe('8.50')
    expect(centsToDollarInput(0)).toBe('0.00')
  })
})
