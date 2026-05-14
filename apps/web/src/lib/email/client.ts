import { Resend } from "resend"
import { getSecret } from "@/lib/secrets"

let _client: Resend | null = null

export function getResendClient(): Resend {
  if (_client) return _client
  _client = new Resend(getSecret("resend_api_key"))
  return _client
}
