import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReactNode } from "react"

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
      className="min-h-screen bg-neutral-50"
      data-establishment-name={establishment.name}
      data-establishment-description={establishment.description ?? ""}
      data-establishment-slug={establishment.slug}
    >
      <div className="max-w-md mx-auto">
        {/* Header base — cada página injeta contexto via BookingHeader próprio */}
        <header className="bg-primary px-4 pt-8 pb-6 rounded-b-3xl">
          <h1 className="text-white text-base font-bold">{establishment.name}</h1>
          <p className="text-white/70 text-xs mt-0.5">{establishment.description}</p>
        </header>
        <main className="px-4 py-5 flex flex-col gap-4">{children}</main>
      </div>
    </div>
  )
}
