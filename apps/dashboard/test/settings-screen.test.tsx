import { ApiProvider } from '@repo/api-client'
import { ThemeProvider, ToastProvider } from '@repo/ui'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsScreen from '../app/(dashboard)/settings/index'
import { NavigationGuardProvider, useGuardedNavigation } from '../src/components/NavigationGuard'

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

/** Stands in for the sidebar: any navigation the shell would run. */
const navAction = vi.fn()
function NavAway() {
  const guarded = useGuardedNavigation()
  return (
    <button type="button" onClick={() => guarded(navAction)}>
      Nav away
    </button>
  )
}

const guarded = () => (
  <NavigationGuardProvider>
    <NavAway />
    <SettingsScreen />
  </NavigationGuardProvider>
)

const dirty = () => {
  // Any edit will do; the currency select is the cheapest to drive.
  fireEvent.click(screen.getByText('SGD'))
  fireEvent.click(screen.getByText('MYR'))
}

beforeEach(() => {
  mutate.mockClear()
  navAction.mockClear()
})

describe('SettingsScreen', () => {
  it('offers currencies from the supported list instead of free text', () => {
    wrap(<SettingsScreen />)

    // The closed list, not an input that would accept "XXX".
    dirty()

    // Choosing a currency dirties the form; saving sends the choice.
    fireEvent.click(screen.getByText('Save changes'))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'MYR' }) }),
      expect.anything(),
    )
  })

  it('keeps the save controls in the header, shown only while dirty', () => {
    wrap(<SettingsScreen />)

    expect(screen.queryByText('Save changes')).toBeNull()
    expect(screen.queryByText('Discard')).toBeNull()

    dirty()

    // In the header — above the first section, not at the foot of the page.
    const save = screen.getByText('Save changes')
    const firstSection = screen.getByText('Ordering')
    expect(
      save.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByText('Discard')).toBeTruthy()
  })

  it('lets navigation pass when nothing is unsaved', () => {
    wrap(guarded())

    fireEvent.click(screen.getByText('Nav away'))
    expect(navAction).toHaveBeenCalledOnce()
  })

  it('asks before leaving with unsaved changes, and keeps editing on request', async () => {
    wrap(guarded())
    dirty()

    fireEvent.click(screen.getByText('Nav away'))
    expect(navAction).not.toHaveBeenCalled()
    expect(screen.getByText('Unsaved changes')).toBeTruthy()

    fireEvent.click(screen.getByText('Keep editing'))
    // The dialog leaves through its exit animation; nothing navigated.
    await waitForElementToBeRemoved(() => screen.queryByText('Unsaved changes'))
    expect(navAction).not.toHaveBeenCalled()
  })

  it('discards and leaves from the dialog', async () => {
    wrap(guarded())
    dirty()

    fireEvent.click(screen.getByText('Nav away'))
    fireEvent.click(screen.getByText('Discard changes'))

    // Navigation lands once the guard's history sentinel has collapsed.
    await waitFor(() => expect(navAction).toHaveBeenCalledOnce())
    expect(mutate).not.toHaveBeenCalled()
  })

  it('asks when the browser itself goes back', async () => {
    window.history.pushState({}, '', '/settings')
    wrap(guarded())
    dirty()

    window.history.back()

    expect(await screen.findByText('Unsaved changes')).toBeTruthy()
    expect(window.location.pathname).toBe('/settings')
  })

  it('saves and leaves from the dialog', async () => {
    wrap(guarded())
    dirty()

    fireEvent.click(screen.getByText('Nav away'))
    fireEvent.click(screen.getByText('Save and leave'))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currency: 'MYR' }) }),
      expect.anything(),
    )
    // Navigation waits for the server to accept the save.
    expect(navAction).not.toHaveBeenCalled()
    const options = mutate.mock.calls[0]?.[1] as { onSuccess?: () => void }
    act(() => options.onSuccess?.())
    await waitFor(() => expect(navAction).toHaveBeenCalledOnce())
  })
})
