import { fireEvent, screen } from '@testing-library/react'
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
