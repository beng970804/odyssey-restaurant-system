import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { Grid, GridItem } from '../src/primitives/Grid'
import { lightTheme } from '../src/theme/tokens'

// jsdom reports `documentElement.clientWidth` as 0, so react-native-web's
// Dimensions always reads a zero-width window and every test would render the
// compact layout. The viewport is faked at the one hook that reads it.
let viewportWidth = 1440

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    useWindowDimensions: () => ({ width: viewportWidth, height: 900, scale: 1, fontScale: 1 }),
  }
})

const cells = [0, 1, 2, 3].map((index) => <View key={index} testID={`cell-${index}`} />)
const cell = (index: number) => screen.getByTestId(`cell-${index}`).parentElement

/** Anything at all between the grid and its item is enough to hide the span. */
const Wrapped = ({ children }: { children: ReactNode }) => <>{children}</>
const gutter = lightTheme.space.lg / 2

beforeEach(() => {
  viewportWidth = 1440
})

describe('Grid', () => {
  it('leaves room for the gap, so four columns stay on one row', () => {
    // The bug this pins: `flexBasis: 25%` plus a 16px gap is wider than the
    // row, so the fourth card wrapped and sat alone. The gutter lives in each
    // cell's padding instead, which keeps the four bases summing to exactly
    // 100%.
    wrap(<Grid columns={4}>{cells}</Grid>)

    expect(cell(0)?.style.flex).toBe('1 1 25%')
    expect(cell(0)).toHaveStyle({
      paddingLeft: `${gutter}px`,
      paddingRight: `${gutter}px`,
    })
  })

  it('pulls the outer gutter back so cells align with the content edge', () => {
    wrap(<Grid columns={4}>{cells}</Grid>)

    expect(cell(0)?.parentElement).toHaveStyle({
      marginLeft: `-${gutter}px`,
      marginRight: `-${gutter}px`,
      rowGap: `${lightTheme.space.lg}px`,
    })
  })

  it('halves four columns on a medium screen rather than cramming them', () => {
    viewportWidth = 1024
    wrap(<Grid columns={4}>{cells}</Grid>)

    expect(cell(0)?.style.flex).toBe('1 1 50%')
  })

  it('collapses to one column when compact', () => {
    viewportWidth = 600
    wrap(<Grid columns={4}>{cells}</Grid>)

    expect(cell(0)?.style.flex).toBe('1 1 100%')
  })

  it('keeps the columns a compact caller asks to keep', () => {
    // A phone has room for two of something small side by side, and stacking
    // them costs a screen of scrolling. The caller says which.
    viewportWidth = 390
    wrap(
      <Grid columns={5} compactColumns={2}>
        {cells}
      </Grid>,
    )

    expect(cell(0)?.style.flex).toBe('1 1 50%')
  })

  it('clamps a span to the compact columns too', () => {
    viewportWidth = 390
    wrap(
      <Grid columns={5} compactColumns={2}>
        <GridItem span={2}>
          <View testID="cell-0" />
        </GridItem>
      </Grid>,
    )

    expect(cell(0)?.style.flex).toBe('1 1 100%')
  })

  it('gives a cell the width it asks for', () => {
    wrap(
      <Grid columns={5}>
        <View testID="cell-0" />
        <GridItem span={2}>
          <View testID="cell-1" />
        </GridItem>
      </Grid>,
    )

    expect(cell(0)?.style.flex).toBe('1 1 20%')
    expect(cell(1)?.style.flex).toBe('1 1 40%')
  })

  it('clamps a span that no longer fits the collapsed grid', () => {
    // Two of five is 40% at full width and a whole row at two columns. Left
    // unclamped it would be 100% of a 50% cell's worth of basis and overflow.
    viewportWidth = 1024
    wrap(
      <Grid columns={5}>
        <GridItem span={2}>
          <View testID="cell-0" />
        </GridItem>
      </Grid>,
    )

    expect(cell(0)?.style.flex).toBe('1 1 100%')
  })

  it('only spans as a direct child, which is the whole of the contract', () => {
    // Wrapped in anything, the marker is invisible to the grid and the cell
    // falls back to one column. Documented rather than fixed: the fix is a
    // spans prop on the grid, which puts a cell's layout somewhere other than
    // the cell.
    wrap(
      <Grid columns={4}>
        <Wrapped>
          <GridItem span={2}>
            <View testID="cell-0" />
          </GridItem>
        </Wrapped>
      </Grid>,
    )

    expect(cell(0)?.style.flex).toBe('1 1 25%')
  })
})
