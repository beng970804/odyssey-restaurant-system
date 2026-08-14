import type { MenuItemWithCategory } from '@repo/api-client'
import { formatMoney } from '@repo/shared'
import {
  IconButton,
  Inline,
  Surface,
  Text,
  overlayTransition,
  useInteractionState,
  useTheme,
} from '@repo/ui'
import { Image, Pressable, View } from 'react-native'

export type MenuPickCardProps = {
  item: MenuItemWithCategory
  /** How many are already in the order. Zero renders the card as one big Add. */
  quantity: number
  currency: string
  onAdd: (item: MenuItemWithCategory) => void
  onSetQuantity: (itemId: string, quantity: number) => void
}

const PHOTO_HEIGHT = 96

/** How far the card sinks under a press — felt, not watched. */
const PRESS_SCALE = 0.98

/**
 * One card per dish, and the whole card is the Add button: at the pass, the
 * fastest path from "customer said laksa" to a line on the order is one press
 * on a big target, not a stepper zeroed at 0 next to a separate button.
 *
 * Once the item is in the order the card's footer becomes a stepper, mirroring
 * the summary panel — either side can adjust and the other follows, because
 * both write to the same form. The footer's row is reserved from the start and
 * faded in, so the first add changes what the card shows, not how tall it is.
 */
export function MenuPickCard({
  item,
  quantity,
  currency,
  onAdd,
  onSetQuantity,
}: MenuPickCardProps) {
  const theme = useTheme()
  const { state, handlers } = useInteractionState()
  const unavailable = !item.isAvailable
  const inOrder = quantity > 0
  const interactive = !unavailable

  return (
    <Surface
      bordered
      radius="md"
      style={[
        {
          overflow: 'hidden',
          opacity: unavailable ? 0.5 : 1,
          flex: 1,
          // The card is the button, so the card carries the feedback: a
          // brighter edge under the pointer, a sink while pressed.
          borderColor:
            interactive && state.hovered ? theme.color.border.strong : theme.color.border.default,
          transform: [{ scale: interactive && state.pressed ? PRESS_SCALE : 1 }],
        },
        overlayTransition('transform, border-color', 120),
      ]}
    >
      <Pressable
        role="button"
        aria-label={unavailable ? item.name : `Add ${item.name}`}
        aria-disabled={unavailable}
        disabled={unavailable}
        {...handlers}
        onPress={() => onAdd(item)}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            role="img"
            aria-label={item.name}
            style={{ width: '100%', height: PHOTO_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          // No photo: the dish's initial on the brand tint, so a menu that has
          // not been photographed still reads as a grid rather than a gap.
          <View
            style={{
              width: '100%',
              height: PHOTO_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.color.brand.subtle,
            }}
          >
            <Text variant="display" color="brand">
              {item.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ padding: theme.space.md, gap: theme.space.xs }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {item.name}
          </Text>
          <Inline justify="space-between">
            <Text variant="caption" color="muted">
              {formatMoney(item.priceCents, currency)}
            </Text>
            {unavailable ? (
              <Text variant="caption" color="muted">
                Unavailable
              </Text>
            ) : null}
          </Inline>
        </View>
      </Pressable>

      {/* Reserved even at zero: invisible and inert rather than absent, so the
          stepper fades in where it was always going to be. */}
      <View
        testID="stepper-row"
        aria-hidden={!inOrder}
        pointerEvents={inOrder ? 'auto' : 'none'}
        style={[{ opacity: inOrder ? 1 : 0 }, overlayTransition('opacity', 150)]}
      >
        <Inline
          justify="space-between"
          style={{
            paddingHorizontal: theme.space.sm,
            paddingBottom: theme.space.sm,
          }}
        >
          <IconButton
            label={`Remove one ${item.name}`}
            size="sm"
            disabled={!inOrder}
            onPress={() => onSetQuantity(item.id, quantity - 1)}
          >
            <Text>−</Text>
          </IconButton>
          <Text variant="bodyStrong">{String(quantity)}</Text>
          <IconButton
            label={`Add one ${item.name}`}
            size="sm"
            disabled={!inOrder}
            onPress={() => onSetQuantity(item.id, quantity + 1)}
          >
            <Text>+</Text>
          </IconButton>
        </Inline>
      </View>
    </Surface>
  )
}
