import { useEffect } from 'react'
import { useTheme } from '../theme/ThemeProvider'

/**
 * The house focus ring for DOM elements this design system does not render.
 *
 * `focusRingStyle` covers every primitive, because every primitive is a React
 * Native view whose focus state we track. A third-party DOM widget — the chart's
 * focusable `<svg>` — has neither, so it falls back to the browser's default
 * blue outline, which is the one thing on screen not drawn from the tokens.
 *
 * `:focus-visible` is the platform's own version of the rule `focusRingStyle`
 * implements by hand: a ring for the keyboard, nothing for the mouse.
 */
export function useDomFocusRing(className: string) {
  const theme = useTheme()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const id = `focus-ring-${className}`
    const style = document.getElementById(id) ?? document.createElement('style')
    style.id = id
    style.textContent = [
      `.${className} :focus { outline: none; }`,
      `.${className} :focus-visible {`,
      `  outline: ${theme.borderWidth.medium}px solid ${theme.color.border.focus};`,
      `  outline-offset: 2px;`,
      `  border-radius: ${theme.radius.sm}px;`,
      `}`,
    ].join('\n')

    if (!style.isConnected) document.head.append(style)
    return () => style.remove()
  }, [className, theme])

  return className
}
