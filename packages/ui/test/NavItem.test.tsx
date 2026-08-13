import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { hexToRgb, wrap } from './helpers'
import { NavItem } from '../src/primitives/NavItem'
import { SideNav } from '../src/primitives/SideNav'
import { Tabs } from '../src/primitives/Tabs'
import { lightTheme } from '../src/theme/tokens'

describe('NavItem', () => {
  it('marks the active item', () => {
    wrap(<NavItem href="/orders" label="Orders" active onPress={vi.fn()} />)
    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-current', 'page')
  })

  it('leaves an inactive item uncurrent', () => {
    wrap(<NavItem href="/orders" label="Orders" onPress={vi.fn()} />)
    expect(screen.getByTestId('nav-item-orders')).not.toHaveAttribute('aria-current')
  })

  it('shows a focus ring on keyboard focus', () => {
    wrap(<NavItem href="/orders" label="Orders" onPress={vi.fn()} />)
    const item = screen.getByTestId('nav-item-orders')

    fireEvent.focus(item)
    expect(item.style.outlineStyle).toBe('solid')
    expect(item.style.outlineColor).toBe(hexToRgb(lightTheme.color.border.focus))
  })

  it('navigates on press', () => {
    const onPress = vi.fn()
    wrap(<NavItem href="/orders" label="Orders" onPress={onPress} />)

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onPress).toHaveBeenCalledWith('/orders')
  })

  it('renders a badge count when given one', () => {
    wrap(<NavItem href="/orders" label="Orders" badge={4} onPress={vi.fn()} />)
    expect(screen.getByText('4')).toBeTruthy()
  })
})

describe('SideNav', () => {
  const items = [
    { href: '/', label: 'Home' },
    { href: '/orders', label: 'Orders', badge: 2 },
  ]

  it('marks exactly one item active from the current path', () => {
    wrap(<SideNav items={items} activeHref="/orders" onNavigate={vi.fn()} />)

    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-home')).not.toHaveAttribute('aria-current')
  })

  it('hides labels when collapsed but keeps the item reachable', () => {
    wrap(<SideNav items={items} activeHref="/" onNavigate={vi.fn()} collapsed />)

    expect(screen.queryByText('Orders')).toBeNull()
    expect(screen.getByTestId('nav-item-orders')).toHaveAttribute('aria-label', 'Orders')
  })

  it('knows nothing about routing — it just reports the href', () => {
    const onNavigate = vi.fn()
    wrap(<SideNav items={items} activeHref="/" onNavigate={onNavigate} />)

    fireEvent.click(screen.getByTestId('nav-item-orders'))
    expect(onNavigate).toHaveBeenCalledWith('/orders')
  })
})

describe('Tabs', () => {
  it('reports the chosen tab', () => {
    const onChange = vi.fn()
    wrap(
      <Tabs
        tabs={[
          { value: 'all', label: 'All' },
          { value: 'live', label: 'Live' },
        ]}
        value="all"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByText('Live'))
    expect(onChange).toHaveBeenCalledWith('live')
  })
})
