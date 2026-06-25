import { resolveMediaUrl } from "./media"

describe("resolveMediaUrl", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
  })

  it("resolves backend upload paths against the configured API base", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://165.245.213.231.nip.io/api/"

    expect(resolveMediaUrl("/uploads/announcements/53.jpg")).toBe(
      "https://165.245.213.231.nip.io/api/uploads/announcements/53.jpg"
    )
    expect(resolveMediaUrl("uploads/tournaments/53.jpg")).toBe(
      "https://165.245.213.231.nip.io/api/uploads/tournaments/53.jpg"
    )
  })

  it("does not duplicate the api prefix for backend upload paths that already include it", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://165.245.213.231.nip.io/api"

    expect(resolveMediaUrl("/api/uploads/announcements/53.jpg")).toBe(
      "https://165.245.213.231.nip.io/api/uploads/announcements/53.jpg"
    )
    expect(resolveMediaUrl("api/uploads/announcements/53.jpg")).toBe(
      "https://165.245.213.231.nip.io/api/uploads/announcements/53.jpg"
    )
  })

  it("keeps local assets and absolute URLs untouched", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://165.245.213.231.nip.io/api"

    expect(resolveMediaUrl("/images/avatar-placeholder.png")).toBe("/images/avatar-placeholder.png")
    expect(resolveMediaUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg")
    expect(resolveMediaUrl("blob:preview")).toBe("blob:preview")
  })
})
