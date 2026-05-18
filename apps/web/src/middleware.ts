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

  // ── API routes — skip middleware auth entirely, each route handles its own auth ──
  if (pathname.startsWith("/api/")) {
    return supabaseResponse
  }

  // ── Public paths — always allowed ─────────────────────────────────────────
  const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/terms", "/privacy"]
  const isPublicPath = publicPaths.includes(pathname)
  const isAdminPath = pathname.startsWith("/admin")
  const isAuthCallbackPath = pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/update-password")
  const isOnboardingPath = pathname.startsWith("/onboarding")
  const isSuspendedPath = pathname.startsWith("/suspended")
  const isOrgPage = pathname.startsWith("/org/")

  if (isAuthCallbackPath) {
    return supabaseResponse
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    if (isPublicPath || isSuspendedPath || isOrgPage) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // ── Logged in — fetch profile for role/suspension/onboarding checks ────────
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, is_suspended, onboarding_completed")
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

  // ── Security headers for authenticated app routes ──────────────────────────
  const isAppPath = pathname.startsWith("/app")
  if (isAppPath) {
    // Prevent search engines from indexing authenticated contact pages
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow")
    // Prevent clickjacking
    supabaseResponse.headers.set("X-Frame-Options", "DENY")
    // Prevent MIME sniffing
    supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  }

  // ── Security headers applied to ALL routes ─────────────────────────────────
  // HSTS: tell browsers to always use HTTPS for the next year
  supabaseResponse.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  )
  // CSP: restrict which resources the browser can load
  supabaseResponse.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
      "frame-src https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://www.google.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  )
  // Prevent referrer leaking on cross-origin navigation
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
