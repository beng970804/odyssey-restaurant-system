import { View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

export type DividerProps = { orientation?: 'horizontal' | 'vertical' }

export function Divider({ orientation = 'horizontal' }: DividerProps) {
  const theme = useTheme()
  const thickness = theme.borderWidth.thin

  return (
    <View
      style={
        orientation === 'horizontal'
          ? { height: thickness, alignSelf: 'stretch', backgroundColor: theme.color.border.default }
          : { width: thickness, alignSelf: 'stretch', backgroundColor: theme.color.border.default }
      }
    />
  )
}
