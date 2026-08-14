import { describe, expect, it } from 'vitest'
import { wrap } from './helpers'
import { useDomFocusRing } from '../src/hooks/useDomFocusRing'
import { lightTheme } from '../src/theme/tokens'

function Host() {
  const className = useDomFocusRing('chart-under-test')
  return <div className={className} />
}

const rule = () => document.getElementById('focus-ring-chart-under-test')?.textContent ?? ''

describe('useDomFocusRing', () => {
  it('draws the house ring for the keyboard and nothing for the mouse', () => {
    // A third-party widget's <svg> cannot take a style prop from us, so the
    // browser's default blue outline is the one thing on screen not drawn from
    // the tokens. `:focus-visible` is the platform's version of the rule every
    // primitive implements by hand.
    wrap(<Host />)

    expect(rule()).toContain('.chart-under-test :focus { outline: none; }')
    expect(rule()).toContain(`solid ${lightTheme.color.border.focus}`)
    expect(rule()).toContain(':focus-visible')
  })

  it('takes the stylesheet away with the component', () => {
    const { unmount } = wrap(<Host />)
    expect(document.getElementById('focus-ring-chart-under-test')).toBeTruthy()

    unmount()
    expect(document.getElementById('focus-ring-chart-under-test')).toBeNull()
  })
})
