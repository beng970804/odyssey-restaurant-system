/**
 * The one file in the repo allowed to call `fetch` — the lint config exempts it
 * by path. Unwrapping the backend's error envelope here means every screen gets
 * a typed ApiError with a `code` it can branch on, instead of each component
 * parsing response bodies.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787'

type ErrorEnvelope = { error?: { code: string; message: string; details?: unknown } }

/**
 * Returns Orval's `{ status, data, headers }` envelope, not the bare body.
 * The generated hooks type every response as a union discriminated by `status`
 * and read `.data` off it, so a mutator that returns the parsed body makes
 * `response.data` the body's *own* `data` field — which typechecks, because
 * both are objects, and then fails at runtime with `meta` undefined.
 */
export async function customFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorEnvelope | null
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? res.statusText,
      body?.error?.details,
    )
  }

  const data = res.status === 204 ? undefined : await res.json()
  return { status: res.status, data, headers: res.headers } as T
}
