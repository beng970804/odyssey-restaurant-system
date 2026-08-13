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
  },
  // Raw react-native source does not parse under Vitest (Flow types,
  // untranspiled JSX). Every primitive runs through React Native Web in the
  // browser anyway, so the web rendering is what gets tested.
  resolve: { alias: { 'react-native': 'react-native-web' } },
})
