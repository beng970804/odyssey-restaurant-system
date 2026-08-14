import { vi } from 'vitest'

/**
 * Reanimated's worklets are a Babel transform that Vite's pipeline does not
 * run, and Gesture Handler wants a native view registry that jsdom has not
 * got. Both are mocked down to the plain React Native Web equivalents, which
 * leaves everything a test can actually assert on — DOM, accessibility,
 * callbacks — rendered by the real component.
 *
 * The consequence is deliberate: no test here proves the animation *moves*.
 * Gesture feel is verified by hand in the browser, not in jsdom.
 *
 * Importing this module registers both mocks; the calls are hoisted, so they
 * have to sit at the top level rather than inside a setup function.
 */

/**
 * jsdom ships no `matchMedia`, and anything that asks about motion or colour
 * scheme reads one. Every query answers false — no reduced-motion preference,
 * the light theme the assertions are written against — which leaves each test
 * free to say otherwise for the one query it cares about.
 */
const noop = () => {}

if (globalThis.window && !globalThis.window.matchMedia) {
  globalThis.window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      // React Native Web's `Appearance` subscribes through the deprecated pair,
      // so a stub without them crashes every render under this environment.
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

vi.mock('react-native-reanimated', async () => {
  const { View } = await import('react-native')

  return {
    default: { View },
    useSharedValue: (initial: number) => ({ value: initial }),
    // Evaluated rather than stubbed to {}: the factory reads shared values, so
    // running it puts the resting style in the DOM where a test can assert on
    // it. It is not reactive — a test that changes a prop has to re-render.
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    // The completion callback is invoked rather than dropped: a component that
    // unmounts itself when its exit animation finishes would otherwise never
    // unmount under test, and "closed" would be untestable.
    withSpring: (toValue: number, _config?: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true)
      return toValue
    },
    withTiming: (toValue: number, _config?: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true)
      return toValue
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    // A real piecewise-linear interpolation, not a passthrough: the reveal
    // styles are built out of it, so stubbing it would make every assertion
    // about them meaningless.
    interpolate: (value: number, input: number[], output: number[]) => {
      const last = input.length - 1
      if (value <= input[0]!) return output[0]!
      if (value >= input[last]!) return output[last]!

      const i = input.findIndex((stop, index) => index > 0 && value <= stop)
      const [from, to] = [input[i - 1]!, input[i]!]
      const span = to - from

      return span === 0
        ? output[i]!
        : output[i - 1]! + ((value - from) / span) * (output[i]! - output[i - 1]!)
    },
    Extrapolation: { CLAMP: 'clamp' },
  }
})

vi.mock('react-native-gesture-handler', async () => {
  const { View } = await import('react-native')
  // Every builder method returns the builder, so the real component's chained
  // configuration runs unchanged.
  const builder: Record<string, unknown> = {}
  for (const method of [
    'onBegin',
    'onUpdate',
    'onEnd',
    'onFinalize',
    'onTouchesDown',
    'activeOffsetX',
    'failOffsetY',
    'enabled',
    'minDistance',
  ]) {
    builder[method] = () => builder
  }

  return {
    Gesture: { Pan: () => builder },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  }
})
