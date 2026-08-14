import { fireEvent, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { wrap } from './helpers'
import { EmptyState } from '../src/primitives/EmptyState'
import { Table, type Column } from '../src/primitives/Table'

type Row = { id: string; name: string }
const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'id', header: 'Reference', render: (row) => row.id, width: 120 },
]
const rows: Row[] = [
  { id: 'a1', name: 'Nasi Lemak' },
  { id: 'b2', name: 'Teh Tarik' },
]
const keyExtractor = (row: Row) => row.id

describe('Table', () => {
  it('renders headers and rows', () => {
    wrap(<Table columns={columns} data={rows} keyExtractor={keyExtractor} />)

    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Nasi Lemak')).toBeTruthy()
    expect(screen.getByText('Teh Tarik')).toBeTruthy()
  })

  it('renders the empty state when data is empty', () => {
    wrap(
      <Table
        columns={columns}
        data={[]}
        keyExtractor={keyExtractor}
        emptyState={<EmptyState title="No orders yet" />}
      />,
    )
    expect(screen.getByText('No orders yet')).toBeTruthy()
  })

  it('falls back to a default empty state', () => {
    wrap(<Table columns={columns} data={[]} keyExtractor={keyExtractor} />)
    expect(screen.getByText('Nothing here yet')).toBeTruthy()
  })

  it('renders skeletons while loading', () => {
    wrap(<Table columns={columns} data={[]} loading keyExtractor={keyExtractor} />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('prefers loading over the empty state, so a slow list never flashes empty', () => {
    wrap(<Table columns={columns} data={[]} loading keyExtractor={keyExtractor} />)
    expect(screen.queryByText('Nothing here yet')).toBeNull()
  })

  it('renders an error state with a working retry', () => {
    const onRetry = vi.fn()
    wrap(
      <Table
        columns={columns}
        data={[]}
        error={new Error('boom')}
        onRetry={onRetry}
        keyExtractor={keyExtractor}
      />,
    )

    fireEvent.click(screen.getByText('Try again'))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('calls onRowPress with the row', () => {
    const onRowPress = vi.fn()
    wrap(
      <Table columns={columns} data={rows} keyExtractor={keyExtractor} onRowPress={onRowPress} />,
    )

    fireEvent.click(screen.getByText('Nasi Lemak'))
    expect(onRowPress).toHaveBeenCalledWith(rows[0])
  })
})

type SpendRow = { id: string; name: string; spendCents: number }

const spendRows: SpendRow[] = [
  { id: 'a', name: 'Aisha', spendCents: 500 },
  { id: 'b', name: 'Chen', spendCents: 12_000 },
  { id: 'c', name: 'Bala', spendCents: 3000 },
]

const spendColumns: Column<SpendRow>[] = [
  { key: 'name', header: 'Customer', render: (row) => <Text>{row.name}</Text>, sortable: true },
  {
    key: 'spend',
    header: 'Spend',
    // The rendered cell is money; the sort has to run on the raw cents, which
    // is the whole reason `sortValue` exists separately from `render`.
    render: (row) => <Text>{`$${(row.spendCents / 100).toFixed(2)}`}</Text>,
    sortValue: (row) => row.spendCents,
    sortable: true,
  },
]

/** Row order as rendered — the header is row 0, so it is dropped. */
const namesInOrder = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => spendRows.find((candidate) => row.textContent?.includes(candidate.name))?.name)

/** The header label gains an arrow once sorted, so the accessible name is what stays matchable. */
const pressHeader = (label: string) => fireEvent.click(screen.getByLabelText(`Sort by ${label}`))

describe('Table sorting', () => {
  it('leaves rows in the given order until a header is pressed', () => {
    wrap(<Table columns={spendColumns} data={spendRows} keyExtractor={keyExtractor} />)
    expect(namesInOrder()).toEqual(['Aisha', 'Chen', 'Bala'])
  })

  it('sorts text ascending on the first press and descending on the second', () => {
    wrap(<Table columns={spendColumns} data={spendRows} keyExtractor={keyExtractor} />)

    pressHeader('Customer')
    expect(namesInOrder()).toEqual(['Aisha', 'Bala', 'Chen'])

    pressHeader('Customer')
    expect(namesInOrder()).toEqual(['Chen', 'Bala', 'Aisha'])
  })

  it('sorts a numeric column highest-first, because that is the question being asked', () => {
    wrap(<Table columns={spendColumns} data={spendRows} keyExtractor={keyExtractor} />)

    pressHeader('Spend')
    expect(namesInOrder()).toEqual(['Chen', 'Bala', 'Aisha'])
  })

  it('sorts money by its underlying cents, not by the formatted string', () => {
    wrap(<Table columns={spendColumns} data={spendRows} keyExtractor={keyExtractor} />)

    // Lexicographically "$120.00" < "$30.00" < "$5.00", so sorting the rendered
    // text ascending would read Chen, Bala, Aisha — the same order this
    // produces descending, which is why the second press is the real check.
    pressHeader('Spend')
    pressHeader('Spend')
    expect(namesInOrder()).toEqual(['Aisha', 'Bala', 'Chen'])
  })

  it('does not make a column sortable unless it asks to be', () => {
    const plain: Column<SpendRow>[] = [
      { key: 'name', header: 'Customer', render: (row) => <Text>{row.name}</Text> },
    ]
    wrap(<Table columns={plain} data={spendRows} keyExtractor={keyExtractor} />)

    expect(screen.queryByLabelText('Sort by Customer')).toBeNull()
    expect(namesInOrder()).toEqual(['Aisha', 'Chen', 'Bala'])
  })

  it('keeps a fixed-width column at its width', () => {
    // React Native's `flex: 0` becomes `flex: 0 1 0%` on the web, and a zero
    // flex-basis beats the `width` beside it — every fixed column collapsed to
    // nothing and its text piled up on the next one. The longhands are spelled
    // out so the basis is the width.
    wrap(<Table columns={columns} data={rows} keyExtractor={keyExtractor} />)

    const cell = screen.getByText('Reference').parentElement
    expect(cell?.style.flex).toBe('0 0 120px')
    expect(cell?.style.width).toBe('120px')
  })

  it('lets a column with no width share out the rest of the row', () => {
    wrap(<Table columns={columns} data={rows} keyExtractor={keyExtractor} />)

    const cell = screen.getByText('Name').parentElement
    expect(cell?.style.flex).toBe('1 1 0%')
  })

  it('centres a centred column in its cell', () => {
    // A control column — a toggle, say — reads as its own column only when it
    // sits under the middle of its header rather than hard against the number
    // in the column before it.
    const centred: Column<Row>[] = [
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'id', header: 'Reference', render: (row) => row.id, width: 120, align: 'center' },
    ]
    wrap(<Table columns={centred} data={rows} keyExtractor={keyExtractor} />)

    expect(screen.getByText('a1').parentElement?.style.alignItems).toBe('center')
  })

  it('starts from defaultSort when one is given', () => {
    wrap(
      <Table
        columns={spendColumns}
        data={spendRows}
        keyExtractor={keyExtractor}
        defaultSort={{ key: 'spend', desc: true }}
      />,
    )
    expect(namesInOrder()).toEqual(['Chen', 'Bala', 'Aisha'])
  })
})
