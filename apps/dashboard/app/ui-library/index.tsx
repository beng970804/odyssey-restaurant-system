import { ScrollView } from 'react-native'
import { Stack, Text, useTheme, useThemeMode, Button, Inline } from '@repo/ui'
import {
  ColorTokens,
  ComponentGallery,
  ElevationScale,
  LayoutTokens,
  Section,
  SpacingScale,
  TypeSpecimen,
} from '../../src/features/ui-library/sections'

/**
 * A live view of the design system rather than a screenshot of one: every
 * swatch, specimen and scale is read from the token objects, so this page
 * cannot drift from what the app actually renders.
 */
export default function UiLibraryScreen() {
  const theme = useTheme()
  const { mode, setMode } = useThemeMode()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.color.bg.canvas }}
      contentContainerStyle={{
        padding: theme.space.xl,
        maxWidth: 1100,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <Inline justify="space-between" style={{ marginBottom: theme.space.xl }}>
        <Stack gap="xs">
          <Text variant="display">UI Library</Text>
          <Text color="muted">
            Tokens and primitives, rendered from the theme. Tab through the examples to check focus.
          </Text>
        </Stack>
        <Button variant="secondary" onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
          {mode === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      </Inline>

      <Section title="Colour">
        <ColorTokens />
      </Section>
      <Section title="Typography">
        <TypeSpecimen />
      </Section>
      <Section title="Spacing">
        <SpacingScale />
      </Section>
      <Section title="Elevation">
        <ElevationScale />
      </Section>
      <Section title="Layout and grid">
        <LayoutTokens />
      </Section>
      <Section title="Components">
        <ComponentGallery />
      </Section>
    </ScrollView>
  )
}
