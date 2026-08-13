import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The same setup packages/ui uses: React Native Web under jsdom.
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.ts'] },
  resolve: { alias: { 'react-native': 'react-native-web' } },
})
