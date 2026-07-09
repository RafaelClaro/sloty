import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ReactNode } from "react"
import { ScrollToTop } from "./ScrollToTop"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const establishment = await prisma.establishment.findUnique({
    where: { slug },
    select: { name: true },
  })

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🩺</text></svg>`

  return {
    title: establishment?.name ?? "AgendaWeb",
    icons: {
      icon: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    },
    viewport: "width=device-width, initial-scale=1",
  }
}

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

  const primary      = establishment.primaryColor  ?? "#2D6A4F"
  const primaryDark  = establishment.primaryDark   ?? "#1B4332"
  const primaryLight = establishment.primaryLight  ?? "#D8F3DC"
  const fontFamily   = establishment.fontFamily    ?? null

  return (
    <div
      className="min-h-dvh"
      style={{
        "--color-primary":       primary,
        "--color-primary-dark":  primaryDark,
        "--color-primary-light": primaryLight,
        background: "#F8F9FC",
      } as React.CSSProperties}
      data-establishment-name={establishment.name}
      data-establishment-description={establishment.description ?? ""}
      data-establishment-slug={establishment.slug}
    >
      {fontFamily && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;600;700&display=swap`}
        />
      )}
      <ScrollToTop />
      <div className="max-w-md mx-auto">
        <div className="px-4 pt-6">
          <header
            className="relative overflow-hidden rounded-3xl px-5 py-6 shadow-elevated"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)` }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="relative">
              <h1
                className="text-white text-lg font-bold"
                style={fontFamily ? { fontFamily: `'${fontFamily}', Georgia, serif` } : undefined}
              >
                {establishment.name}
              </h1>
              {establishment.description && (
                <p className="text-white/75 text-xs mt-1">{establishment.description}</p>
              )}
            </div>
          </header>
        </div>
        <main className="px-4 py-5 flex flex-col gap-4">{children}</main>
      </div>
    </div>
  )
}
