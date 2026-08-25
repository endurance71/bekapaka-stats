import type { DataState, DataStateStatus } from './schemas'

/** Fake CMS/backend fixtures only when explicitly enabled (never on production by default). */
export function allowFakeData(): boolean {
  return process.env.SITE_ALLOW_FAKE_DATA === '1'
}

export function resolveFallbackState<T>(
  status: Extract<DataStateStatus, 'error' | 'empty'>,
  fake: T,
  empty: T,
  message: string
): DataState<T> {
  if (allowFakeData()) {
    return { status, data: fake, source: 'fallback', message }
  }
  return { status, data: empty, source: 'live', message }
}
