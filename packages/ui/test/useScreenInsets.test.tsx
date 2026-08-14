import { screen } from '@testing-library/react'
import { Text } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { describe, expect, it } from 'vitest'
import { wrap } from './helpers'
import { useScreenInsets } from '../src/hooks/useScreenInsets'

function Probe() {
  const insets = useScreenInsets()
  return <Text>{`top:${insets.top} bottom:${insets.bottom}`}</Text>
}

describe('useScreenInsets', () => {
  it('reads zero where nobody provides insets, rather than throwing', () => {
    // The library's own hook throws without a provider. A browser, a jsdom
    // test and a bare render all mean the same thing: no edge is withheld.
    wrap(<Probe />)

    expect(screen.getByText('top:0 bottom:0')).toBeTruthy()
  })

  it('reads the provider where one is mounted', () => {
    wrap(
      <SafeAreaInsetsContext.Provider value={{ top: 59, bottom: 34, left: 0, right: 0 }}>
        <Probe />
      </SafeAreaInsetsContext.Provider>,
    )

    expect(screen.getByText('top:59 bottom:34')).toBeTruthy()
  })
})
