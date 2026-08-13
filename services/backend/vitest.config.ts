import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // PGlite loads a WebAssembly build of Postgres per test file; forks keep
    // each file's instance genuinely isolated.
    pool: 'forks',
  },
})
