import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/about",
  "/pricing",
  "/contact",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/public",
]

// Define auth routes (redirect to home if already authenticated)
const authRoutes = ["/login", "/register", "/forgot-password"]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check if route is public
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )

    // Check if route is an auth route
    const isAuthRoute = authRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (token && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If user is not authenticated and route is not public, redirect to login
    if (!token && !isPublicRoute && !pathname.startsWith("/api/auth")) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow API auth routes
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true
        }
        // Allow public routes
        const isPublicRoute = publicRoutes.some(
          (route) =>
            req.nextUrl.pathname === route ||
            req.nextUrl.pathname.startsWith(`${route}/`)
        )
        if (isPublicRoute) {
          return true
        }
        // Require token for protected routes
        return token !== null
      },
    },
  }
)

// Configure matcher for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
