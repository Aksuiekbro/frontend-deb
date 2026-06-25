const API_UPLOAD_PATH_RE = /^\/?api\/uploads\//
const UPLOAD_PATH_RE = /^\/?uploads\//
const ABSOLUTE_URL_RE = /^(https?:|data:|blob:)/

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (ABSOLUTE_URL_RE.test(url)) return url

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "")
  if (!apiUrl) return url

  const path = url.startsWith("/") ? url : `/${url}`

  if (API_UPLOAD_PATH_RE.test(url)) {
    return apiUrl.endsWith("/api") ? `${apiUrl}${path.slice(4)}` : `${apiUrl}${path}`
  }

  if (!UPLOAD_PATH_RE.test(url)) return url

  return `${apiUrl}${path}`
}
