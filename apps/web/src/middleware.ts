import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/database.types"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Public paths — always allowed ─────────────────────────────────────────
  const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/terms", "/privacy"]
  const isPublicPath = publicPaths.includes(pathname)
  const isAdminPath = pathname.startsWith("/admin")
  const isAuthCallbackPath = pathname.startsWith("/auth/callback")
  const isOnboardingPath = pathname.startsWith("/onboarding")
  const isSuspendedPath = pathname.startsWith("/suspended")

  if (isAuthCallbackPath) {
    return supabaseResponse
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    if (isPublicPath || isSuspendedPath) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // ── Logged in — fetch profile for role/suspension/onboarding checks ────────
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Use typed local vars to avoid TS inference issues on partial selects
  const isUserSuspended = profileData?.is_suspended ?? false
  const isOnboardingDone = profileData?.onboarding_completed ?? false
  const userRole = profileData?.role ?? null

  // Suspended users → /suspended (except already there)
  if (isUserSuspended && !isSuspendedPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/suspended"
    return NextResponse.redirect(url)
  }

  // Unsuspended user trying to visit /suspended → redirect to app
  if (!isUserSuspended && isSuspendedPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    return NextResponse.redirect(url)
  }

  // Onboarding not done → /onboarding (except already there or public)
  if (!isOnboardingDone && !isOnboardingPath && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/onboarding"
    return NextResponse.redirect(url)
  }

  // Onboarding done — don't let them re-visit /onboarding
  if (isOnboardingDone && isOnboardingPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    return NextResponse.redirect(url)
  }

  // Admin routes — require role = 'admin'
  if (isAdminPath && userRole !== "admin") {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    return NextResponse.redirect(url)
  }

  // Logged-in user visiting public marketing pages → send to app
  if (isPublicPath && pathname !== "/" && isOnboardingDone) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
