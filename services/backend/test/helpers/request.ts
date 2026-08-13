import type { createTestApp } from './app'

type TestApp = ReturnType<typeof createTestApp>

/** A JSON request against a test app — the shape every write test needs. */
export function jsonRequest(app: TestApp) {
  return (path: string, method: string, body: unknown) =>
    app.request(path, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
}

export async function errorCode(res: Response) {
  return ((await res.json()) as { error: { code: string } }).error.code
}
