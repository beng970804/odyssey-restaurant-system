import { Text as RNText, type StyleProp, type TextStyle } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import type { TypographyToken } from '../theme/types'

/** Semantic colour names only — a screen never names a hue. */
export type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'onBrand' | 'brand'

export type TextProps = {
  children: ReactNode
  /** The role the text plays, which carries size, weight and line height together. */
  variant?: TypographyToken
  color?: TextColor
  align?: 'left' | 'center' | 'right'
  numberOfLines?: number
  /**
   * Same advance for every digit. For figures that animate or align in
   * columns — proportional digits make "888" wider than "911", so a counting
   * value flickers in width and anything laid out after it dances.
   */
  tabular?: boolean
  /**
   * What assistive tech reads instead of the rendered characters. For text that
   * is mid-animation, or shorthand a screen reader would spell out wrongly.
   */
  accessibilityLabel?: string
  style?: StyleProp<TextStyle>
}

export function Text({
  children,
  variant = 'body',
  color = 'primary',
  align,
  numberOfLines,
  tabular,
  accessibilityLabel,
  style,
}: TextProps) {
  const theme = useTheme()

  return (
    <RNText
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      style={[
        theme.typography[variant],
        {
          color: color === 'brand' ? theme.color.brand.default : theme.color.text[color],
          textAlign: align,
        },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  )
}
