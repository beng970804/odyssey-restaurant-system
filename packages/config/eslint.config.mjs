import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // Never lint build output or Orval output (ADR 0002 forbids hand-editing it).
  { ignores: ['**/dist/**', '**/.expo/**', '**/generated/**'] },
  ...tseslint.configs.recommended,
  // v7 moved the flat presets under `configs.flat.*`; top-level `configs.*` is
  // eslintrc format. (v6 exposed the flat one as `configs['recommended-latest']`.)
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      // Guardrail: the dashboard must not call fetch directly (spec §3, "Avoid").
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use generated hooks from @repo/api-client.' },
      ],
    },
  },
  {
    // The one file allowed to call fetch: the Orval mutator.
    files: ['packages/api-client/src/fetcher.ts', 'src/fetcher.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  prettier,
)
