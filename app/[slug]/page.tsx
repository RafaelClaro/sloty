import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const establishment = await prisma.establishment.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
    },
  })

  if (!establishment) notFound()

  if (establishment.services.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">Nenhum serviço disponível no momento.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        Escolha o serviço
      </p>
      {establishment.services.map((service: { id: string; name: string; durationMinutes: number; price: string | number; description?: string | null }) => (
        <Link
          key={service.id}
          href={`/${slug}/agendar?serviceId=${service.id}`}
          className="bg-neutral-100 border border-neutral-300 rounded-md p-4
                     hover:border-secondary hover:-translate-y-0.5 hover:shadow-elevated
                     active:scale-[0.99] transition-all duration-150 block"
        >
          <p className="text-sm font-bold text-neutral-900">{service.name}</p>
          <div className="flex gap-4 mt-1">
            <span className="text-sm text-neutral-500">⏱ {service.durationMinutes} min</span>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(Number(service.price))}
            </span>
          </div>
          {service.description && (
            <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{service.description}</p>
          )}
        </Link>
      ))}
    </>
  )
}
