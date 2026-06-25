interface ReadResponseErrorOptions {
  fallback: string
  unauthorized?: string
  badRequest?: string
  conflict?: string
  payloadTooLarge?: string
  serverError?: string
  allowPlainText?: boolean
}

function statusFallback(response: Response, options: ReadResponseErrorOptions): string {
  if ((response.status === 401 || response.status === 403) && options.unauthorized) {
    return options.unauthorized
  }
  if (response.status === 400 && options.badRequest) {
    return options.badRequest
  }
  if (response.status === 409 && options.conflict) {
    return options.conflict
  }
  if (response.status === 413 && options.payloadTooLarge) {
    return options.payloadTooLarge
  }
  if (response.status >= 500 && options.serverError) {
    return options.serverError
  }
  return options.fallback
}

export async function readResponseError(response: Response, options: ReadResponseErrorOptions): Promise<string> {
  try {
    const text = await response.text()
    if (text) {
      try {
        const data = JSON.parse(text)
        if (typeof data?.message === "string") return data.message
      } catch {
        if (options.allowPlainText) return text
      }
    }
  } catch {
    // Fall through to a status-aware fallback when the body cannot be read.
  }

  return statusFallback(response, options)
}
