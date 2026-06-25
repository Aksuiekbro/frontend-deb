import { readResponseError } from "./http-error"

describe("readResponseError", () => {
  it("returns a backend JSON message when it is a string", async () => {
    const response = new Response(JSON.stringify({ message: "Invitee not found" }), { status: 404 })

    await expect(readResponseError(response, { fallback: "Registration failed" }))
      .resolves.toBe("Invitee not found")
  })

  it("ignores non-string JSON messages and uses the status fallback", async () => {
    const response = new Response(JSON.stringify({ message: { text: "Invalid username" } }), { status: 400 })

    await expect(readResponseError(response, {
      fallback: "Registration failed",
      badRequest: "Please check your details and try again.",
    })).resolves.toBe("Please check your details and try again.")
  })

  it("uses auth-specific fallbacks for empty unauthorized responses", async () => {
    const response = new Response("", { status: 403 })

    await expect(readResponseError(response, {
      fallback: "Login failed. Please try again.",
      unauthorized: "Invalid username or password.",
    })).resolves.toBe("Invalid username or password.")
  })

  it("uses conflict and server fallbacks for empty responses", async () => {
    await expect(readResponseError(new Response("", { status: 409 }), {
      fallback: "Registration failed",
      conflict: "That username or email is already taken.",
    })).resolves.toBe("That username or email is already taken.")

    await expect(readResponseError(new Response("", { status: 503 }), {
      fallback: "Registration failed",
      serverError: "Server error. Please try again later.",
    })).resolves.toBe("Server error. Please try again later.")
  })

  it("does not show HTML error bodies unless plain text is explicitly allowed", async () => {
    const response = new Response("<html>bad gateway</html>", { status: 502 })

    await expect(readResponseError(response, {
      fallback: "Failed to submit content",
      serverError: "Server error. Please try again later.",
    })).resolves.toBe("Server error. Please try again later.")
  })

  it("can return plain text bodies for endpoints that intentionally send text", async () => {
    const response = new Response("Team limit reached", { status: 400 })

    await expect(readResponseError(response, {
      fallback: "Failed to submit content",
      allowPlainText: true,
    })).resolves.toBe("Team limit reached")
  })
})
