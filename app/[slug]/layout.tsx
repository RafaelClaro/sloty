import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReactNode } from "react"
import { ScrollToTop } from "./ScrollToTop"

export default async function EstablishmentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const establishment = await prisma.establishment.findUnique({
    where: { slug },
  })

  if (!establishment) notFound()

  // Passa dados do estabelecimento via data attributes pra páginas client acessarem
  return (
    <div
      className="min-h-screen bg-neutral-100"
      data-establishment-name={establishment.name}
      data-establishment-description={establishment.description ?? ""}
      data-establishment-slug={establishment.slug}
    >
      <ScrollToTop />
      <div className="max-w-md mx-auto">
        {/* Header base — cada página injeta contexto via BookingHeader próprio */}
        <div className="sticky top-0 z-10 px-4 pt-4 pb-2 bg-neutral-100">
          <header
            className="relative overflow-hidden rounded-3xl px-5 py-6 shadow-elevated"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-lg">
                {establishment.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="text-white text-base font-bold truncate">{establishment.name}</h1>
                <p className="text-white/75 text-xs mt-0.5 truncate">{establishment.description}</p>
              </div>
            </div>
          </header>
        </div>
        <main className="px-4 pb-5 flex flex-col gap-4">{children}</main>
      </div>
    </div>
  )
}
