const API_UPLOAD_PATH_RE = /^\/?api\/uploads\//
const UPLOAD_PATH_RE = /^\/?uploads\//
const ABSOLUTE_HTTP_URL_RE = /^https?:/i
const PASS_THROUGH_URL_RE = /^(data:|blob:)/i

function resolveUploadPath(path: string, apiUrl: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (API_UPLOAD_PATH_RE.test(path)) {
    return apiUrl.endsWith("/api") ? `${apiUrl}${normalizedPath.slice(4)}` : `${apiUrl}${normalizedPath}`
  }

  return `${apiUrl}${normalizedPath}`
}

export function resolveMediaUrl(url?: string | null): string | undefined {
  const value = url?.trim()
  if (!value) return undefined
  if (PASS_THROUGH_URL_RE.test(value)) return value

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "")
  if (ABSOLUTE_HTTP_URL_RE.test(value)) {
    if (!apiUrl) return value

    try {
      const parsed = new URL(value)
      const uploadPath = `${parsed.pathname}${parsed.search}${parsed.hash}`

      if (API_UPLOAD_PATH_RE.test(parsed.pathname) || UPLOAD_PATH_RE.test(parsed.pathname)) {
        return resolveUploadPath(uploadPath, apiUrl)
      }
    } catch {
      return value
    }

    return value
  }

  if (!apiUrl) return value

  const path = value.startsWith("/") ? value : `/${value}`

  if (API_UPLOAD_PATH_RE.test(value)) {
    return resolveUploadPath(path, apiUrl)
  }

  if (!UPLOAD_PATH_RE.test(value)) return value

  return resolveUploadPath(path, apiUrl)
}
