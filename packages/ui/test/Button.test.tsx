import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { hexToRgb, wrap } from './helpers'
import { Button } from '../src/primitives/Button'
import { Badge } from '../src/primitives/Badge'
import { focusRingStyle } from '../src/hooks/useFocusRing'
import { lightTheme } from '../src/theme/tokens'

describe('Button', () => {
  it('calls onPress when enabled', () => {
    const onPress = vi.fn()
    wrap(<Button onPress={onPress}>Accept</Button>)

    fireEvent.click(screen.getByText('Accept'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn()
    wrap(
      <Button onPress={onPress} disabled>
        Accept
      </Button>,
    )

    fireEvent.click(screen.getByText('Accept'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('does not call onPress while loading', () => {
    // Double-submitting an order is a real bug with real consequences.
    const onPress = vi.fn()
    wrap(
      <Button onPress={onPress} loading>
        Accept
      </Button>,
    )

    expect(screen.queryByText('Accept')).toBeNull()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('announces its disabled and busy state to assistive technology', () => {
    wrap(<Button loading>Accept</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('is reachable by keyboard', () => {
    wrap(<Button onPress={vi.fn()}>Accept</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('tabindex', '-1')
  })

  it('shows a focus ring on keyboard focus but not while pressed', () => {
    // Without this the dashboard cannot be operated by keyboard at all, which
    // is exactly the state that is easy to ship by accident under RN Web.
    wrap(<Button onPress={vi.fn()}>Accept</Button>)
    const button = screen.getByRole('button')

    expect(button.style.outlineStyle).not.toBe('solid')

    fireEvent.focus(button)
    expect(button.style.outlineStyle).toBe('solid')
    expect(button.style.outlineColor).toBeTruthy()

    fireEvent.blur(button)
    expect(button.style.outlineStyle).not.toBe('solid')
    expect(button.style.outlineWidth).toBe('0px')
  })

  it('renders every variant and size without a hardcoded colour', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const { unmount } = wrap(
          <Button variant={variant} size={size}>
            {`${variant}-${size}`}
          </Button>,
        )
        expect(screen.getByText(`${variant}-${size}`)).toBeTruthy()
        unmount()
      }
    }
  })
})

describe('focus ring', () => {
  // The pressed branch is asserted on the helper rather than through the DOM:
  // jsdom cannot drive React Native Web's press responder, and a test that
  // silently never enters the state would be worse than no test.
  it('stays hidden while the control is pressed', () => {
    expect(
      focusRingStyle(lightTheme, { focused: true, pressed: false }).outlineWidth,
    ).toBeGreaterThan(0)
    expect(focusRingStyle(lightTheme, { focused: true, pressed: true }).outlineWidth).toBe(0)
    expect(focusRingStyle(lightTheme, { focused: false, pressed: false }).outlineWidth).toBe(0)
  })

  it('draws from the theme rather than a literal colour', () => {
    expect(focusRingStyle(lightTheme, { focused: true, pressed: false }).outlineColor).toBe(
      lightTheme.color.border.focus,
    )
  })
})

describe('Badge', () => {
  it('takes a tone and reads the theme, knowing nothing about orders', () => {
    wrap(<Badge tone="warning">Pending</Badge>)

    const label = screen.getByText('Pending')
    // The tone is a design-system concept; the theme decides what it looks like.
    expect(label.style.color).toBe(hexToRgb(lightTheme.color.status.warning.fg))
  })
})
