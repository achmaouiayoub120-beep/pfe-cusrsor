import { verifyToken, signToken } from "../lib/auth"

describe("auth", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret"
  })

  it("signs and verifies token", () => {
    const payload = { sub: "user-1", email: "a@b.c", role: "AGENT" as const }
    const token = signToken(payload)
    expect(token).toBeTruthy()
    const decoded = verifyToken(token)
    expect(decoded?.sub).toBe("user-1")
    expect(decoded?.email).toBe("a@b.c")
    expect(decoded?.role).toBe("AGENT")
  })

  it("returns null for invalid token", () => {
    expect(verifyToken("invalid")).toBeNull()
  })
})
