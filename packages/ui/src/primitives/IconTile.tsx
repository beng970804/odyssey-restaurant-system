import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import type { StatusTone } from '../theme/types'
import type { NavItemIcon } from './NavItem'

export type IconTileTone = StatusTone | 'brand'

export type IconTileProps = {
  /** Fixed node, or a render prop that takes the colour the tone decides. */
  icon: NavItemIcon
  tone?: IconTileTone
  size?: 'md' | 'lg'
}

const SIZE = { md: 36, lg: 44 } as const
const ICON_SIZE = { md: 18, lg: 22 } as const

/**
 * An icon on its own tinted disc. The tint is the status *background*, never a
 * saturated fill — the icon sits on it at text contrast, which a `#F97316`-style
 * block would not survive (ADR 0006).
 */
export function IconTile({ icon, tone = 'brand', size = 'md' }: IconTileProps) {
  const theme = useTheme()
  const { bg, fg } =
    tone === 'brand'
      ? { bg: theme.color.brand.subtle, fg: theme.color.brand.default }
      : theme.color.status[tone]

  return (
    <View
      style={{
        width: SIZE[size],
        height: SIZE[size],
        borderRadius: theme.radius.full,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {typeof icon === 'function' ? icon({ color: fg, size: ICON_SIZE[size] }) : icon}
    </View>
  )
}
