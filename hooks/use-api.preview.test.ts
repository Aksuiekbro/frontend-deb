describe("preview News hooks", () => {
  const previousPreviewMode = process.env.NEXT_PUBLIC_PREVIEW_MODE

  afterEach(() => {
    if (previousPreviewMode === undefined) {
      delete process.env.NEXT_PUBLIC_PREVIEW_MODE
    } else {
      process.env.NEXT_PUBLIC_PREVIEW_MODE = previousPreviewMode
    }
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("serves a selected preview list item without requesting the backend", async () => {
    process.env.NEXT_PUBLIC_PREVIEW_MODE = "true"
    const useSWR = jest.fn(() => ({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    }))
    const getNews = jest.fn()

    jest.doMock("swr", () => ({
      __esModule: true,
      default: useSWR,
    }))
    jest.doMock("@/lib/api", () => ({
      api: { getNews },
    }))

    const { useSingleNews } = await import("./use-api")
    const result = useSingleNews(901)

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), {
      revalidateOnFocus: false,
    })
    expect(result.newsItem).toMatchObject({
      id: 901,
      title: "Day 1 Highlights",
    })
    expect(result.isLoading).toBe(false)
    expect(result.error).toBeUndefined()
    expect(await result.mutate()).toBe(result.newsItem)
    expect(getNews).not.toHaveBeenCalled()
  })
})
