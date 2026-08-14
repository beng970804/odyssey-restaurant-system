import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ChipGroup,
  DateRangePicker,
  Divider,
  Drawer,
  Field,
  Grid,
  GridItem,
  Heading,
  IconButton,
  IconTile,
  Inline,
  Input,
  Meter,
  Modal,
  NavDrawer,
  NavGroup,
  NavItem,
  OverlayPanel,
  Pagination,
  SearchInput,
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
  Textarea,
  useTheme,
  useToast,
  type DateRange,
  type StatusTone,
} from '@repo/ui'
import IconBowlChopsticks from '@tabler/icons-react-native/IconBowlChopsticks'
import IconCake from '@tabler/icons-react-native/IconCake'
import IconCoffee from '@tabler/icons-react-native/IconCoffee'
import IconToolsKitchen2 from '@tabler/icons-react-native/IconToolsKitchen2'
import { useState, type ReactNode } from 'react'

type IconProps = { color: string; size: number }
import { View } from 'react-native'

/** Hoisted for the same reason as the chip icons: a render prop is a component. */
const KITCHEN_ICON = (props: IconProps) => <IconToolsKitchen2 {...props} />
const COFFEE_ICON = (props: IconProps) => <IconCoffee {...props} />

const CHIP_ICONS = [
  (props: IconProps) => <IconToolsKitchen2 {...props} />,
  (props: IconProps) => <IconBowlChopsticks {...props} />,
  (props: IconProps) => <IconCake {...props} />,
  (props: IconProps) => <IconCoffee {...props} />,
]

/**
 * Long on purpose, and hoisted — an icon render prop defined during render is a
 * new component each pass.
 *
 * The length is the point: the rail only drags and wheel-scrolls when it
 * overflows, so a demo of four chips would render a row that never moves and
 * read as the feature being broken. Twelve overflows a laptop.
 */
const CATEGORY_CHIPS = [
  'All',
  'Starters',
  'Noodles & Rice',
  'Mains',
  'Grills',
  'Sides',
  'Salads',
  'Desserts',
  'Drinks',
  'Hot Drinks',
  'Specials',
  'Seasonal',
].map((label, index) => ({
  value: index === 0 ? 'all' : label.toLowerCase().replaceAll(/[^a-z]+/g, '-'),
  label,
  icon: CHIP_ICONS[index % CHIP_ICONS.length],
}))

const PLAIN_CHIPS = [
  { value: 'all', label: 'Without icons' },
  { value: 'plain', label: 'Also fine' },
]

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
            {theme.elevation[level].boxShadow}
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

/** The gallery is a static page; a fixed "today" keeps it that way. */
const TODAY = '2026-08-14'

const TONES: StatusTone[] = ['success', 'warning', 'danger', 'info', 'neutral']

// Defined outside the component: a render function declared inline is treated
// as a nested component definition and remounts on every render.
const NAME_COLUMN = [
  { key: 'name', header: 'Item', render: (row: { name: string }) => <Text>{row.name}</Text> },
]

export function ComponentGallery() {
  const [switchValue, setSwitchValue] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [noteValue, setNoteValue] = useState('')
  const [selectValue, setSelectValue] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [tab, setTab] = useState('all')
  const [chip, setChip] = useState('all')
  const [page, setPage] = useState(1)

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Text variant="bodyStrong">Headings</Text>
        {/* Heading, not Text: it renders a real h1/h2/h3, which is what a
            screen reader navigates a page by. */}
        <Heading level={1}>Level one</Heading>
        <Heading level={2}>Level two</Heading>
        <Heading level={3}>Level three</Heading>
      </Stack>

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
          {/* No z-index: both of these open through Popover, which mounts its
              panel above the page rather than beside the control. */}
          <View style={{ width: 220 }}>
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
          <DateRangePicker value={dateRange} onChange={setDateRange} today={TODAY} />
          <Switch value={switchValue} onValueChange={setSwitchValue} label="Auto-accept" />
        </Inline>
        <Inline gap="lg" wrap align="flex-start">
          <View style={{ width: 220 }}>
            <SearchInput value={searchValue} onChangeText={setSearchValue} />
          </View>
          <View style={{ width: 300 }}>
            <Textarea
              value={noteValue}
              onChangeText={setNoteValue}
              placeholder="Kitchen note"
              numberOfLines={3}
            />
          </View>
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Field — the label, hint and error around a control</Text>
        {/* Every state at once: the point of Field is that a label, a hint and
            an error are laid out the same way on every form in the app. */}
        <Inline gap="lg" wrap align="flex-start">
          <View style={{ width: 220 }}>
            <Field label="Item name" hint="Shown on the receipt" required>
              <Input value={inputValue} onChangeText={setInputValue} placeholder="Nasi Lemak" />
            </Field>
          </View>
          <View style={{ width: 220 }}>
            <Field label="Price" error="Enter an amount in cents">
              <Input value="" onChangeText={() => {}} placeholder="0" error />
            </Field>
          </View>
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Identity and measures</Text>
        <Inline gap="lg" wrap align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Avatar key={size} name="Siti Rahman" size={size} />
          ))}
          {(['brand', 'success', 'warning', 'danger', 'info'] as const).map((tone) => (
            <IconTile key={tone} tone={tone} icon={KITCHEN_ICON} />
          ))}
          <IconTile size="lg" icon={COFFEE_ICON} />
        </Inline>
        <Inline gap="lg" wrap align="flex-start">
          {(['success', 'warning', 'danger'] as const).map((tone) => (
            <View key={tone} style={{ width: 220 }}>
              <Meter
                value={tone === 'success' ? 18 : tone === 'warning' ? 46 : 61}
                max={64}
                tone={tone}
                label={`${tone} capacity`}
              />
            </View>
          ))}
        </Inline>
      </Stack>

      <Stack gap="sm">
        <Text variant="bodyStrong">Grid — 12 columns, collapsing by breakpoint</Text>
        {/* Resize the window: four across a wide screen, two on a laptop, one
            when compact. The span lives on the cell, not on the grid. */}
        <Grid columns={4} gap="md">
          <GridItem span={2}>
            <Card padding="md">
              <Text>span 2</Text>
            </Card>
          </GridItem>
          {['span 1', 'span 1', 'span 1'].map((label, index) => (
            <Card key={`${label}-${index}`} padding="md">
              <Text>{label}</Text>
            </Card>
          ))}
        </Grid>
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
        <Breadcrumbs
          items={[
            { label: 'Menu', href: '/menu' },
            { label: 'Noodles & Rice', href: '/menu' },
            { label: 'Nasi Lemak' },
          ]}
          onNavigate={() => {}}
        />
        <Inline gap="xl" align="flex-start" wrap>
          <Stack gap="xs" style={{ width: 220 }}>
            <NavItem href="/x" label="Default" />
            <NavItem href="/y" label="Active" active />
          </Stack>
          <View style={{ width: 220 }}>
            {/* The heading a SideNav puts above a run of items — shown on its
                own because it is what disappears when the nav collapses. */}
            <NavGroup title="Service">
              <NavItem href="/orders" label="Orders" />
              <NavItem href="/menu" label="Menu" />
            </NavGroup>
          </View>
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
        {/*
          Beside Tabs on purpose: the pair is what shows why both exist. Tabs
          switch panels and announce themselves as a tablist; ChipGroup filters
          a list that stays put and announces a radiogroup.
        */}
        <ChipGroup chips={CATEGORY_CHIPS} value={chip} onChange={setChip} />
        <Text variant="caption" color="muted">
          The rail above overflows on purpose — drag it sideways, or roll a mouse wheel over it.
        </Text>
        <ChipGroup
          chips={PLAIN_CHIPS}
          value={chip === 'all' ? 'all' : 'plain'}
          onChange={setChip}
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
        {/* Under a table because that is the only place it ever appears. */}
        <Pagination page={page} pageSize={20} total={94} onPageChange={setPage} />
      </Stack>

      <Overlays />
    </Stack>
  )
}

/**
 * Dialogs need somewhere to be opened from, so they get their own component
 * rather than another four pieces of state on the gallery.
 *
 * The panel below the two buttons is the same chrome Modal and Drawer put
 * around their contents, shown at rest: it is the piece that has to look
 * identical in both, and the only way to compare it is side by side.
 */
function Overlays() {
  const theme = useTheme()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Stack gap="sm">
      <Text variant="bodyStrong">Overlays and feedback</Text>
      <Inline gap="sm" wrap>
        <Button onPress={() => setModalOpen(true)}>Open modal</Button>
        <Button variant="secondary" onPress={() => setDrawerOpen(true)}>
          Open drawer
        </Button>
        {TONES.map((tone) => (
          <Button key={tone} variant="ghost" onPress={() => toast.show(`A ${tone} toast`, tone)}>
            {`Toast: ${tone}`}
          </Button>
        ))}
      </Inline>

      <Surface elevation="raised" bordered style={{ width: 360, borderRadius: theme.radius.lg }}>
        <OverlayPanel
          title="OverlayPanel"
          onClose={() => {}}
          footer={<Button size="sm">Save</Button>}
        >
          <Stack gap="sm" style={{ padding: theme.space.lg }}>
            <Text color="muted">The shared header, rule, body and footer.</Text>
          </Stack>
        </OverlayPanel>
      </Surface>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal"
        footer={
          <>
            <Button variant="secondary" size="sm" onPress={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onPress={() => setModalOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <Stack gap="sm" style={{ padding: theme.space.lg }}>
          <Text color="muted">Escape closes it, and so does the scrim.</Text>
        </Stack>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Drawer"
        footer={
          <Button size="sm" onPress={() => setDrawerOpen(false)}>
            Done
          </Button>
        }
      >
        <Stack gap="sm" style={{ padding: theme.space.lg }}>
          <Text color="muted">Same chrome as the modal, arriving from the edge.</Text>
        </Stack>
      </Drawer>
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
