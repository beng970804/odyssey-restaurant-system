import { View, type StyleProp, type ViewStyle } from 'react-native'
import { Children, isValidElement, type ReactNode } from 'react'
import { useTheme, useBreakpoint } from '../theme/ThemeProvider'
import type { SpaceToken } from '../theme/types'

export type GridProps = {
  children: ReactNode
  /** Columns at the widest layout; narrow viewports collapse toward one. */
  columns?: number
  /**
   * Columns to keep once compact. One by default, because most things that sit
   * side by side on a laptop are unreadable at a third of a phone — but a row of
   * small figures is not one of them, and stacking those costs a screen of
   * scrolling to read four numbers.
   */
  compactColumns?: number
  gap?: SpaceToken
  style?: StyleProp<ViewStyle>
}

export type GridItemProps = {
  children: ReactNode
  /** Columns to occupy, clamped to whatever the viewport actually allows. */
  span?: number
}

/**
 * A span marker, not a wrapper: `Grid` reads the span off it and renders the
 * children into its own cell. Declaring the span on the child is what lets a
 * screen say "this one is twice as wide" without doing arithmetic on widths.
 *
 * It only works as a *direct* child of a `Grid`, because that is the only place
 * anything reads it — wrapped in another component, or used outside a grid, it
 * renders its children and the span silently does nothing. The alternative was
 * a `spans={[1, 1, 2]}` prop on the grid, which puts the layout of a cell
 * somewhere other than the cell.
 */
export function GridItem({ children }: GridItemProps) {
  return <>{children}</>
}

const spanOf = (child: ReactNode) =>
  isValidElement<GridItemProps>(child) && child.type === GridItem ? (child.props.span ?? 1) : 1

/**
 * The 12-column grid from the tokens, expressed in flexbox because React Native
 * has no CSS Grid. Collapsing is decided here rather than per screen.
 */
export function Grid({ children, columns = 3, compactColumns = 1, gap = 'lg', style }: GridProps) {
  const theme = useTheme()
  const { isCompact, isWide } = useBreakpoint()
  // Four cards across a laptop are narrower than the numbers they hold, so
  // anything above two halves once before it collapses to the compact count.
  const effective = isCompact
    ? Math.min(columns, compactColumns)
    : isWide
      ? columns
      : Math.min(columns, 2)
  const gapValue = theme.space[gap]
  const gutter = gapValue / 2

  return (
    <View
      style={[
        // The column gutter is padding inside each cell rather than `gap`,
        // because a gap is added *on top of* the flex basis: four 25% cells
        // plus three gaps overflow the row and the fourth wraps onto its own
        // line. Negative margins pull the outer half-gutters back so the cards
        // still line up with the content edge.
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          rowGap: gapValue,
          marginHorizontal: -gutter,
        },
        style,
      ]}
    >
      {/* `Children.toArray` rather than an array check: a grid of one still
          needs its cell, and a `{cond && <Card/>}` child still needs skipping. */}
      {Children.toArray(children).map((child, index) => {
        // A span wider than the collapsed grid would overflow the row, so a
        // 2-of-5 card becomes a full-width one rather than a broken one.
        const basis = `${(100 / effective) * Math.min(spanOf(child), effective)}%`

        return (
          <View
            // Grid children are positional, so the index is the identity.
            key={index}
            style={{
              flexBasis: basis,
              // A full row's bases already sum to 100%, so growth only has
              // somewhere to go on a partly-filled last line — where a lone
              // card widening to fill it beats leaving a quarter-width one
              // stranded under three siblings.
              flexGrow: 1,
              flexShrink: 1,
              paddingHorizontal: gutter,
            }}
          >
            {child}
          </View>
        )
      })}
    </View>
  )
}
