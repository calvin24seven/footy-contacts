import { describe, it, expect, beforeEach, vi } from "vitest"
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../unsubscribe"

// Provide the secret that getSecret() reads from process.env
beforeEach(() => {
  vi.stubEnv("UNSUBSCRIBE_SECRET", "test-secret-for-unsubscribe-hmac-32bytes!!")
})

describe("createUnsubscribeToken / verifyUnsubscribeToken", () => {
  it("produces a valid token that round-trips", () => {
    const token = createUnsubscribeToken("user@example.com", "marketing")
    expect(verifyUnsubscribeToken("user@example.com", "marketing", token)).toBe(true)
  })

  it("rejects a tampered token", () => {
    const token = createUnsubscribeToken("user@example.com", "marketing")
    // Flip the last byte
    const tampered = token.slice(0, -2) + "00"
    expect(verifyUnsubscribeToken("user@example.com", "marketing", tampered)).toBe(false)
  })

  it("rejects a token for a different email", () => {
    const token = createUnsubscribeToken("user@example.com", "marketing")
    expect(verifyUnsubscribeToken("other@example.com", "marketing", token)).toBe(false)
  })

  it("rejects a token for a different category", () => {
    const token = createUnsubscribeToken("user@example.com", "marketing")
    expect(verifyUnsubscribeToken("user@example.com", "transactional", token)).toBe(false)
  })

  it("is case-insensitive for email (normalises to lowercase)", () => {
    const token = createUnsubscribeToken("User@Example.COM", "marketing")
    // Both sides normalise — should still match
    expect(verifyUnsubscribeToken("user@example.com", "marketing", token)).toBe(true)
  })

  it("returns false for a non-hex token (avoids buffer length mismatch crash)", () => {
    expect(verifyUnsubscribeToken("user@example.com", "marketing", "not-hex-at-all!!")).toBe(false)
  })
})
