// Converts a date value into a `LocalDateTime` string (YYYY-MM-DDTHH:mm:ss, no `Z`/ms)
// that the backend's date filters accept. Returns undefined for empty/invalid input so
// optional query params are simply omitted rather than sent as an unparseable value.
export function toBackendDateTime(value?: string | Date | null): string | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 19)
}
