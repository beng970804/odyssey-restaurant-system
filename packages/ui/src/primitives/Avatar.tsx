import { Image, StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

export type AvatarProps = {
  name: string
  size?: 'sm' | 'md' | 'lg'
  /** A portrait to show instead of the initials — the initials stay underneath. */
  imageUri?: string
  testID?: string
}

const SIZE = { sm: 24, md: 32, lg: 40 } as const

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function Avatar({ name, size = 'md', imageUri, testID }: AvatarProps) {
  const theme = useTheme()

  return (
    <View
      testID={testID}
      style={{
        width: SIZE[size],
        height: SIZE[size],
        borderRadius: theme.radius.full,
        backgroundColor: theme.color.brand.subtle,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text variant="caption" color="brand">
        {initials(name)}
      </Text>
      {/*
        Layered over the initials rather than swapped for them: a portrait that
        never loads leaves the letters showing instead of an empty disc.
      */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          accessibilityLabel={name}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  )
}
