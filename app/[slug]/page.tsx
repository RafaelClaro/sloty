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
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Escolha o serviço
      </p>
      {establishment.services.map((service) => (
        <Link
          key={service.id}
          href={`/${slug}/agendar?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceDuration=${service.durationMinutes}&servicePrice=${encodeURIComponent(formatCurrency(Number(service.price)))}&serviceLabel=${encodeURIComponent(`${service.durationMinutes} min · ${formatCurrency(Number(service.price))}`)}`}
          className="group bg-white border border-neutral-300 rounded-2xl p-4 shadow-card
                     hover:border-secondary hover:-translate-y-0.5 hover:shadow-elevated
                     active:scale-[0.99] transition-all duration-150 flex items-center gap-3"
        >
          <div className="w-11 h-11 shrink-0 rounded-full bg-primary-light flex items-center justify-center text-primary text-lg">
            🩺
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">{service.name}</p>
            <div className="flex gap-3 mt-1 items-center">
              <span className="text-xs text-neutral-500">⏱ {service.durationMinutes} min</span>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(Number(service.price))}
              </span>
            </div>
            {service.description && (
              <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{service.description}</p>
            )}
          </div>
          <span className="text-neutral-300 group-hover:text-secondary transition-colors shrink-0">→</span>
        </Link>
      ))}
    </>
  )
}
