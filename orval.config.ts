import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './services/backend/openapi.json',
    output: {
      // Groups generated hooks by the OpenAPI `tags` on each route, so the
      // output is navigable rather than one enormous file.
      mode: 'tags-split',
      target: './packages/api-client/src/generated/endpoints',
      schemas: './packages/api-client/src/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      // No `prettier: true` — this repo uses oxfmt, and Prettier is not
      // installed. Generated output is excluded from formatting and linting
      // either way (ADR 0002).
      override: {
        // Makes every generated call route through our own fetch wrapper.
        mutator: { path: './packages/api-client/src/fetcher.ts', name: 'customFetch' },
        // No `useQuery`/`useMutation` flags: setting either to `true` forces
        // that hook kind onto *every* operation, which generated a useQuery for
        // POST /menu-items — a mutation fired on render. Left unset, orval
        // follows the verb: GET becomes a query, POST/PATCH become mutations.
        query: { signal: true },
      },
    },
  },
})
