import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import SettingsScreen from '../app/(dashboard)/settings/index'

const day = { closed: false, open: '11:00', close: '22:00' }

const settings = {
  id: 1,
  defaultPrepTimeMinutes: 20,
  autoAcceptOrders: false,
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  deliveryFeeCents: 500,
  taxRatePercent: 9,
  currency: 'SGD',
  timezone: 'Asia/Singapore',
  openingHours: {
    mon: day,
    tue: day,
    wed: day,
    thu: day,
    fri: day,
    sat: day,
    sun: { closed: true },
  },
  updatedAt: '2026-08-13T02:00:00.000Z',
}

const mutate = vi.fn()

vi.mock('@repo/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client')>()),
  useGetSettings: () => ({
    data: { status: 200, data: settings },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateSettings: () => ({ mutate, isPending: false }),
}))

const wrap = (ui: ReactElement) =>
  render(
    <ThemeProvider>
      <ApiProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ApiProvider>
    </ThemeProvider>,
  )

describe('SettingsScreen', () => {
  it('offers currencies from the supported list instead of free text', () => {
    wrap(<SettingsScreen />)

    // The closed list, not an input that would accept "XXX".
    fireEvent.click(screen.getByText('SGD'))
    fireEvent.click(screen.getByText('MYR'))

    // Choosing a currency dirties the form; saving sends the choice.
    fireEvent.click(screen.getByText('Save changes'))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'MYR' }) }),
    )
  })
})
