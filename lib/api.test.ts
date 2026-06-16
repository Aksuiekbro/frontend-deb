describe('api client configuration', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    }
    jest.resetModules()
    jest.restoreAllMocks()
  })

  it('does not fall back to the frontend origin when NEXT_PUBLIC_API_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    jest.resetModules()
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const res = await api.register({} as Parameters<typeof api.register>[0])

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({
      message: 'API endpoint is not configured for this deployment.',
    })
  })

  it('treats a blank NEXT_PUBLIC_API_URL as missing after trimming', async () => {
    process.env.NEXT_PUBLIC_API_URL = '   '
    jest.resetModules()
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    const res = await api.login({ username: 'nurassyl', password: 'Test12345!' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(503)
  })

  it('normalizes a configured API URL (trims and strips trailing slashes) into one clean backend URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = '  https://api.example.com///  '
    jest.resetModules()
    const fetchMock = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { api } = await import('./api')
    await api.register({} as Parameters<typeof api.register>[0])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/auth/register')
  })
})
