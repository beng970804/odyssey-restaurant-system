import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The same setup packages/ui uses: React Native Web under jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Vitest leaves node_modules to Node, which resolves extensionless imports
    // literally and so never sees the `.web.js` builds below. Inlining these
    // two hands them to Vite, which does.
    server: {
      deps: {
        inline: [
          'react-native-svg',
          '@tabler/icons-react-native',
          'react-native-safe-area-context',
        ],
      },
    },
  },
  resolve: {
    alias: {
      // Ordered: the specific entries must be caught before the react-native
      // prefix rule sees them. Metro reaches these builds via `platform=web`.
      'react-native-svg': 'react-native-svg/lib/module/ReactNativeSVG.web.js',
      // Its main field is a CJS build whose `require('react-native')` reaches
      // bare Flow source; the ESM build resolves through the alias below.
      'react-native-safe-area-context': 'react-native-safe-area-context/lib/module/index.js',
      'react-native': 'react-native-web',
    },
    /**
     * Metro picks `.web.js` over `.js` because Expo builds with `platform=web`;
     * Vitest has no such notion and would otherwise load the native build of a
     * library like react-native-svg, which ships unparsed Flow.
     */
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
    ],
  },
})
