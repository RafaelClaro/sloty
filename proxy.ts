import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "agendaweb.digital"

function subdomainRewrite(req: NextRequest): NextResponse | null {
  const host = req.headers.get("host") ?? ""
  const hostname = host.replace(/:.*$/, "").replace(/^www\./, "")

  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null

  const slug = hostname.replace(`.${ROOT_DOMAIN}`, "")
  if (!slug || slug === "www") return null

  const url = req.nextUrl.clone()
  const pathname = url.pathname === "/" ? "" : url.pathname
  url.pathname = `/${slug}${pathname}`

  return NextResponse.rewrite(url)
}

const authMiddleware = withAuth({
  pages: {
    signIn: "/admin/login",
  },
})

export default function proxy(req: NextRequest) {
  // Subdomain routing takes priority (public-facing pages)
  const rewrite = subdomainRewrite(req)
  if (rewrite) return rewrite

  // Auth guard for admin routes
  return (authMiddleware as (req: NextRequest) => NextResponse)(req)
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
