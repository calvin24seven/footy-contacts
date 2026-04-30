import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const supabase = await createClient()

  // Password recovery flow — token_hash + type=recovery
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/update-password`)
    }
    return NextResponse.redirect(`${origin}/login?error=invalid_reset_link`)
  }

  // Standard OAuth / magic-link PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/app`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
