import type { ReactNode } from 'react'
import { Text, type TextColor } from './Text'

export type HeadingProps = {
  children: ReactNode
  level?: 1 | 2 | 3
  color?: TextColor
}

const VARIANT_BY_LEVEL = { 1: 'h1', 2: 'h2', 3: 'h3' } as const

/** A heading is a level, not a font size — the scale lives in the tokens. */
export function Heading({ children, level = 1, color = 'primary' }: HeadingProps) {
  return (
    <Text variant={VARIANT_BY_LEVEL[level]} color={color}>
      {children}
    </Text>
  )
}
