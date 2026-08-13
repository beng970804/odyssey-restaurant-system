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
  style?: StyleProp<TextStyle>
}

export function Text({
  children,
  variant = 'body',
  color = 'primary',
  align,
  numberOfLines,
  style,
}: TextProps) {
  const theme = useTheme()

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        theme.typography[variant],
        {
          color: color === 'brand' ? theme.color.brand.default : theme.color.text[color],
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  )
}
