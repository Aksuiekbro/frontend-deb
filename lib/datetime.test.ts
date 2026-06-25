import { toBackendDateTime } from './datetime'

describe('toBackendDateTime', () => {
  it('expands a date-only string to a start-of-day LocalDateTime the backend accepts', () => {
    expect(toBackendDateTime('2026-05-30')).toBe('2026-05-30T00:00:00')
  })

  it('returns undefined for empty/missing input so optional filters are omitted', () => {
    expect(toBackendDateTime('')).toBeUndefined()
    expect(toBackendDateTime(undefined)).toBeUndefined()
  })
})
