import { createHmac, timingSafeEqual } from "crypto"
import { getSecret } from "@/lib/secrets"

/**
 * Creates a tamper-proof token binding email + category together.
 * Used in List-Unsubscribe URLs and verified by the unsubscribe route.
 */
export function createUnsubscribeToken(email: string, category: string): string {
  const secret = getSecret("unsubscribe_secret")
  return createHmac("sha256", secret)
    .update(`${email.toLowerCase()}:${category}`)
    .digest("hex")
}

/**
 * Verifies an unsubscribe token. Timing-safe to prevent oracle attacks.
 */
export function verifyUnsubscribeToken(
  email: string,
  category: string,
  token: string
): boolean {
  try {
    const expected = createUnsubscribeToken(email, category)
    return timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expected, "hex")
    )
  } catch {
    return false
  }
}
