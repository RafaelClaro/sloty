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

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-md mx-auto">
        <header className="bg-primary px-4 pt-10 pb-5">
          <h1 className="text-white text-lg font-bold">{establishment.name}</h1>
          {establishment.description && (
            <p className="text-white/75 text-sm mt-1">{establishment.description}</p>
          )}
        </header>
        <main className="px-4 py-5 flex flex-col gap-4">{children}</main>
      </div>
    </div>
  )
}
