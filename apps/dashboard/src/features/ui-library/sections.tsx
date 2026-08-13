import {
  Badge,
  Button,
  Card,
  Divider,
  IconButton,
  Inline,
  Input,
  NavDrawer,
  NavItem,
  Select,
  SideNav,
  Skeleton,
  Spinner,
  Stack,
  Surface,
  Switch,
  Table,
  Tabs,
  Text,
  useTheme,
  type StatusTone,
} from '@repo/ui'
import { useState, type ReactNode } from 'react'
import { View } from 'react-native'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme()

  return (
    <Stack gap="md" style={{ marginBottom: theme.space['3xl'] }}>
      <Text variant="h2">{title}</Text>
      <Divider />
      {children}
    </Stack>
  )
}

/**
 * Swatches are derived from the token object, never listed by hand — add a
 * colour token and it appears here on the next render. Hardcoding the list
 * would make this page a lie the first time the palette changed.
 */
export function ColorTokens() {
  const theme = useTheme()

  return (
    <Stack gap="lg">
      {Object.entries(theme.color).map(([group, tokens]) => (
        <Stack key={group} gap="sm">
          <Text variant="bodyStrong" color="secondary">
            {group}
          </Text>
          <Inline gap="sm" wrap>
            {Object.entries(tokens).map(([name, value]) => (
              <Swatch
                key={name}
                name={name}
                value={typeof value === 'string' ? value : value.bg}
                foreground={typeof value === 'string' ? undefined : value.fg}
              />
            ))}
          </Inline>
        </Stack>
      ))}
    </Stack>
  )
}

function Swatch({ name, value, foreground }: { name: string; value: string; foreground?: string }) {
  const theme = useTheme()

  return (
    <Stack gap="xs" style={{ width: 132 }}>
      <View
        style={{
          height: 56,
          borderRadius: theme.radius.md,
          backgroundColor: value,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.color.border.default,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {foreground ? <Text style={{ color: foreground }}>Aa</Text> : null}
      </View>
      <Text variant="caption">{name}</Text>
      <Text variant="caption" color="muted">
        {value}
      </Text>
    </Stack>
  )
}

export function TypeSpecimen() {
  const theme = useTheme()

  return (
    <Stack gap="md">
      {Object.entries(theme.typography).map(([name, style]) => (
        <Inline key={name} gap="lg" align="baseline">
          <Text variant="caption" color="muted" style={{ width: 96 }}>
            {name}
          </Text>
          <Text variant={name as 'body'}>The quick brown fox</Text>
          <Text variant="caption" color="muted">
            {`${style.fontSize}/${style.lineHeight} · ${style.fontWeight}`}
          </Text>
        </Inline>
      ))}
    </Stack>
  )
}

export function SpacingScale() {
  const theme = useTheme()

  return (
    <Stack gap="sm">
      {Object.entries(theme.space).map(([name, value]) => (
        <Inline key={name} gap="md">
          <Text variant="caption" color="muted" style={{ width: 48 }}>
            {name}
          </Text>
          <View style={{ width: value, height: 16, backgroundColor: theme.color.brand.default }} />
          <Text variant="caption" color="muted">
            {`${value}px`}
          </Text>
        </Inline>
      ))}
    </Stack>
  )
}

export function ElevationScale() {
  const theme = useTheme()

  return (
    <Inline gap="lg" wrap>
      {(['flat', 'raised', 'overlay', 'modal'] as const).map((level) => (
        <Surface key={level} elevation={level} padding="lg" bordered style={{ width: 160 }}>
          <Text variant="bodyStrong">{level}</Text>
          <Text variant="caption" color="muted">
            {`opacity ${theme.elevation[level].shadowOpacity}`}
          </Text>
        </Surface>
      ))}
    </Inline>
  )
}

export function LayoutTokens() {
  const theme = useTheme()
  const { breakpoints, ...rest } = theme.layout

  return (
    <Stack gap="sm">
      {Object.entries(breakpoints).map(([name, value]) => (
        <Inline key={name} gap="md">
          <Text variant="caption" color="muted" style={{ width: 96 }}>
            {`breakpoint ${name}`}
          </Text>
          <Text variant="caption">{`${value}px`}</Text>
        </Inline>
      ))}
      {Object.entries(rest).map(([name, value]) => (
        <Inline key={name} gap="md">
          <Text variant="caption" color="muted" style={{ width: 96 }}>
            {name}
          </Text>
          <Text variant="caption">{String(value)}</Text>
        </Inline>
      ))}
    </Stack>
  )
}

const TONES: StatusTone[] = ['success', 'warning', 'danger', 'info', 'neutral']

// Defined outside the component: a render function declared inline is treated
// as a nested component definition and remounts on every render.
const NAME_COLUMN = [
  { key: 'name', header: 'Item', render: (row: { name: string }) => <Text>{row.name}</Text> },
]

export function ComponentGallery() {
  const [switchValue, setSwitchValue] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState<string | null>(null)
  const [tab, setTab] = useState('all')

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Text variant="bodyStrong">Buttons — every variant, size and state</Text>
        {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
          <Inline key={variant} gap="sm" wrap>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant}>Default</Button>
            <Button variant={variant} size="lg">
              Large
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Loading
            </Button>
          </Inline>
        ))}
        <Text variant="caption" color="muted">
          Hover and focus are live — tab through them to see the focus ring.
        </Text>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Badges</Text>
        <Inline gap="sm" wrap>
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Form controls</Text>
        <Inline gap="lg" wrap align="flex-start">
          <View style={{ width: 220 }}>
            <Input value={inputValue} onChangeText={setInputValue} placeholder="Default input" />
          </View>
          <View style={{ width: 220 }}>
            <Input value="" onChangeText={() => {}} placeholder="Invalid" error />
          </View>
          <View style={{ width: 220 }}>
            <Input value="" onChangeText={() => {}} placeholder="Disabled" disabled />
          </View>
          <View style={{ width: 220, zIndex: 10 }}>
            <Select
              options={[
                { label: 'Dine in', value: 'dine_in' },
                { label: 'Takeaway', value: 'takeaway' },
              ]}
              value={selectValue}
              onChange={setSelectValue}
              placeholder="Channel"
            />
          </View>
          <Switch value={switchValue} onValueChange={setSwitchValue} label="Auto-accept" />
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Feedback</Text>
        <Inline gap="lg" align="center">
          <Spinner />
          <IconButton label="Example icon button">
            <Text>★</Text>
          </IconButton>
          <View style={{ width: 200 }}>
            <Skeleton height={16} />
          </View>
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Navigation</Text>
        <Inline gap="xl" align="flex-start" wrap>
          <Stack gap="xs" style={{ width: 220 }}>
            <NavItem href="/x" label="Default" />
            <NavItem href="/y" label="Active" active />
          </Stack>
          <View style={{ height: 220 }}>
            <SideNav
              items={[
                { href: '/', label: 'Home' },
                { href: '/orders', label: 'Orders', badge: 3 },
              ]}
              activeHref="/orders"
              onNavigate={() => {}}
            />
          </View>
          <View style={{ height: 220 }}>
            <SideNav
              items={[
                { href: '/', label: 'Home' },
                { href: '/orders', label: 'Orders', badge: 3 },
              ]}
              activeHref="/"
              onNavigate={() => {}}
              collapsed
            />
          </View>
        </Inline>
        <NavDrawerStates />
        <Tabs
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'live', label: 'Live', count: 3 },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Table — every state</Text>
        <Card padding="md">
          <Table
            columns={NAME_COLUMN}
            data={[{ name: 'Nasi Lemak' }, { name: 'Teh Tarik' }]}
            keyExtractor={(r) => r.name}
          />
        </Card>
        <Card padding="md">
          <Table columns={[]} data={[]} keyExtractor={() => ''} loading />
        </Card>
        <Card padding="md">
          <Table
            columns={[]}
            data={[]}
            keyExtractor={() => ''}
            error={new Error('The server is unreachable')}
            onRetry={() => {}}
          />
        </Card>
        <Card padding="md">
          <Table columns={[]} data={[]} keyExtractor={() => ''} />
        </Card>
      </Stack>
    </Stack>
  )
}

/**
 * The drawer only makes sense in motion, so this shows both resting states and
 * lets you drive the transition — the same component the shell uses at every
 * width, at a size that fits on the page.
 */
function NavDrawerStates() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const demo = (isOpen: boolean, onOpenChange: (next: boolean) => void) => (
    <View
      style={{
        width: 360,
        height: 260,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.color.border.default,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
      }}
    >
      <NavDrawer
        items={[
          { href: '/', label: 'Home' },
          { href: '/orders', label: 'Orders', badge: 3 },
        ]}
        activeHref="/orders"
        onNavigate={() => {}}
        open={isOpen}
        onOpenChange={onOpenChange}
      >
        <Stack gap="sm" style={{ padding: theme.space.lg }}>
          <Button size="sm" variant="secondary" onPress={() => onOpenChange(!isOpen)}>
            {isOpen ? 'Close' : 'Open'}
          </Button>
          <Text color="muted">Content surface</Text>
        </Stack>
      </NavDrawer>
    </View>
  )

  return (
    <Stack gap="sm">
      <Text variant="caption" color="muted">
        NavDrawer — swipe the surface sideways, or use the button
      </Text>
      <Inline gap="xl" align="flex-start" wrap>
        {demo(open, setOpen)}
        {demo(true, () => {})}
      </Inline>
    </Stack>
  )
}
