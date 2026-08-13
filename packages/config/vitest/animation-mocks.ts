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

vi.mock('react-native-reanimated', async () => {
  const { View } = await import('react-native')

  return {
    default: { View },
    useSharedValue: (initial: number) => ({ value: initial }),
    // Evaluated rather than stubbed to {}: the factory reads shared values, so
    // running it puts the resting style in the DOM where a test can assert on
    // it. It is not reactive — a test that changes a prop has to re-render.
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    withSpring: (toValue: number) => toValue,
    withTiming: (toValue: number) => toValue,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    interpolate: (value: number) => value,
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
