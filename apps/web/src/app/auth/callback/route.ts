import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  // Only allow same-origin relative paths to prevent open redirect
  const nextParam = searchParams.get("next")
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/app"

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
      // `verified=1` is appended by the signup page's emailRedirectTo — show a success toast
      const destination = searchParams.get("verified") === "1" ? "/app?verified=1" : next
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
