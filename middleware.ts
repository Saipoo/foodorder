import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/login" || path === "/register" || path === "/admin/login" || path === "/admin/register"

  // Define admin paths
  const isAdminPath = path.startsWith("/admin") && path !== "/admin/login" && path !== "/admin/register"

  // Get tokens from cookies
  const authToken = request.cookies.get("auth_token")?.value
  const adminToken = request.cookies.get("admin_token")?.value

  // If it's a public path and user is already logged in, redirect to dashboard
  if (isPublicPath && authToken && !path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If it's admin login/register and admin is already logged in, redirect to admin dashboard
  if ((path === "/admin/login" || path === "/admin/register") && adminToken) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  // If it's a protected user path and user is not logged in, redirect to login
  if (!isPublicPath && !isAdminPath && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If it's a protected admin path and admin is not logged in, redirect to admin login
  if (isAdminPath && !adminToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Verify token validity for protected routes
  if (!isPublicPath) {
    try {
      if (isAdminPath && adminToken) {
        // Verify admin token
        await jwtVerify(adminToken, new TextEncoder().encode(JWT_SECRET))
      } else if (!isAdminPath && authToken) {
        // Verify user token
        await jwtVerify(authToken, new TextEncoder().encode(JWT_SECRET))
      }
    } catch (error) {
      // If token is invalid, clear the cookie and redirect to login
      const response = NextResponse.redirect(new URL(isAdminPath ? "/admin/login" : "/login", request.url))
      response.cookies.delete(isAdminPath ? "admin_token" : "auth_token")
      return response
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}

