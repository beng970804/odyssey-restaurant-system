import IconBowlChopsticks from '@tabler/icons-react-native/IconBowlChopsticks'
import IconCake from '@tabler/icons-react-native/IconCake'
import IconCoffee from '@tabler/icons-react-native/IconCoffee'
import IconMeat from '@tabler/icons-react-native/IconMeat'
import IconSalad from '@tabler/icons-react-native/IconSalad'
import IconSoup from '@tabler/icons-react-native/IconSoup'
import IconToolsKitchen2 from '@tabler/icons-react-native/IconToolsKitchen2'
import type { ComponentType, ReactElement } from 'react'

type TablerIcon = ComponentType<{ color?: string; size?: number | string; stroke?: number }>

/**
 * Categories are free text in the database, so this is a keyword match rather
 * than a lookup — 'Drinks' and 'Hot Drinks' land on the same icon, and anything
 * unrecognised still gets a chip that looks like all the others.
 *
 * It lives in the Menu feature rather than in @repo/ui on purpose: it is this
 * restaurant's vocabulary, not a design-system concern. Giving categories a
 * real icon column would mean a schema change, a contract regen and an editor
 * UI, which is not what the menu needs to look finished.
 *
 * First match wins, so the more specific patterns come first.
 */
const BY_KEYWORD: [RegExp, TablerIcon][] = [
  [/starter|appetis|appetiz|small plate/i, IconSoup],
  [/noodle|rice|pasta|congee/i, IconBowlChopsticks],
  [/dessert|sweet|cake|ice cream/i, IconCake],
  [/drink|beverage|coffee|tea|juice/i, IconCoffee],
  [/side|salad|veg/i, IconSalad],
  [/main|grill|meat|curry|roast/i, IconMeat],
]

const FALLBACK = IconToolsKitchen2

/** A render prop, so the chip it lands in decides the colour. */
export function categoryIcon(
  name: string,
): (state: { color: string; size: number }) => ReactElement {
  const match = BY_KEYWORD.find(([pattern]) => pattern.test(name))
  const Icon = match?.[1] ?? FALLBACK

  return ({ color, size }) => <Icon color={color} size={size} />
}
