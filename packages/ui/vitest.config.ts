import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Testing Library only auto-cleans between tests when globals are on;
    // without it, renders pile up and queries match the previous test's DOM.
    globals: true,
    server: { deps: { inline: ['react-native-safe-area-context'] } },
  },
  // Raw react-native source does not parse under Vitest (Flow types,
  // untranspiled JSX). Every primitive runs through React Native Web in the
  // browser anyway, so the web rendering is what gets tested. Safe-area's main
  // field is a CJS build whose `require('react-native')` reaches bare Flow
  // source; the ESM build resolves through its alias and the inline hands it
  // to Vite (the same treatment the dashboard's config gives it).
  resolve: {
    alias: {
      'react-native-safe-area-context': 'react-native-safe-area-context/lib/module/index.js',
      'react-native': 'react-native-web',
    },
    // `.web.js` ahead of `.js`, as Metro orders them under `platform=web`:
    // safe-area's provider has a codegen native variant and a web one, and
    // only the web build parses here (same list as the dashboard's config).
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
