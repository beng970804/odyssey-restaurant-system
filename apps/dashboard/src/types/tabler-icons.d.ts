/**
 * Icons are imported one subpath at a time — `@tabler/icons-react-native/IconUsers`
 * — because Metro does not tree-shake the package barrel, and importing from it
 * ships all ~5,900 icons in the web bundle.
 *
 * The subpaths are untyped only by accident: the package's `exports` map points
 * its per-icon types at `dist/icons/*.d.ts`, and they are actually published at
 * `dist/icons/icons/*.d.ts`. Until that is fixed upstream this declaration
 * supplies the shape, which is the same for every icon in the set.
 */
declare module '@tabler/icons-react-native/*' {
  import type { ComponentType } from 'react'

  const Icon: ComponentType<{ color?: string; size?: number | string; stroke?: number }>
  export default Icon
}
