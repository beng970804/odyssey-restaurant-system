import { ActivityIndicator } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'inverse' | 'brand'
}

export function Spinner({ size = 'md', tone = 'default' }: SpinnerProps) {
  const theme = useTheme()
  const color =
    tone === 'inverse'
      ? theme.color.text.onBrand
      : tone === 'brand'
        ? theme.color.brand.default
        : theme.color.text.secondary

  return (
    <ActivityIndicator
      accessibilityRole="progressbar"
      size={size === 'lg' ? 'large' : 'small'}
      color={color}
    />
  )
}
