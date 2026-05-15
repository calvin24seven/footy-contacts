import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { email?: string; password?: string }
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  // Password strength validation (mirrors client-side check)
  const hasLength = password.length >= 8
  const hasSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  if (!hasLength || !hasSymbol) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters with a number or symbol." },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://app.footycontacts.com"

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?verified=1`,
    },
  })

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("user already registered")
    ) {
      return NextResponse.json({ error: "An account with this email already exists.", code: "already_exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Could not create account. Please check your details and try again." }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
