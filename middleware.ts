import { NextRequest, NextResponse } from "next/server"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "agendaweb.digital"

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? ""
  const url = req.nextUrl.clone()

  // Remove porta (dev local) e www
  const hostname = host.replace(/:.*$/, "").replace(/^www\./, "")

  // Só age se for subdomínio de ROOT_DOMAIN (ex: catariny.agendaweb.digital)
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return NextResponse.next()

  const slug = hostname.replace(`.${ROOT_DOMAIN}`, "")

  // Subdomínios reservados — não reescreve
  if (!slug || slug === "www") return NextResponse.next()

  // Reescreve /  →  /[slug]
  // Reescreve /agendar  →  /[slug]/agendar  etc.
  const pathname = url.pathname === "/" ? "" : url.pathname
  url.pathname = `/${slug}${pathname}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos e rotas internas do Next.js
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
