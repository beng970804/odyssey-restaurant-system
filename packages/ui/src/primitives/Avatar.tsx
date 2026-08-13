import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

export type AvatarProps = { name: string; size?: 'sm' | 'md' | 'lg' }

const SIZE = { sm: 24, md: 32, lg: 40 } as const

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const theme = useTheme()

  return (
    <View
      style={{
        width: SIZE[size],
        height: SIZE[size],
        borderRadius: theme.radius.full,
        backgroundColor: theme.color.brand.subtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="caption" color="brand">
        {initials(name)}
      </Text>
    </View>
  )
}
