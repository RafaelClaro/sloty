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
      <p
        className="font-semibold uppercase text-neutral-400"
        style={{ fontSize: 11, letterSpacing: "0.08em", marginBottom: 14 }}
      >
        ESCOLHA O SERVIÇO
      </p>

      <div className="flex flex-col" style={{ gap: 10 }}>
        {establishment.services.map((service) => (
          <Link
            key={service.id}
            href={`/${slug}/agendar?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceDuration=${service.durationMinutes}&servicePrice=${encodeURIComponent(formatCurrency(Number(service.price)))}&serviceLabel=${encodeURIComponent(`${service.durationMinutes} min · ${formatCurrency(Number(service.price))}`)}`}
            className="flex items-center active:scale-[0.99] transition-all duration-150"
            style={{
              background: "#ffffff",
              border: "1px solid #E9EDE9",
              borderRadius: 18,
              padding: "16px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              gap: 12,
            }}
          >
            {/* Ícone */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "#F0FDF4",
                fontSize: 22,
              }}
            >
              🩺
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 truncate" style={{ fontSize: 15 }}>
                {service.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-neutral-400" style={{ fontSize: 12 }}>
                  ⏱ {service.durationMinutes} min
                </span>
                <span
                  className="rounded-full bg-neutral-300"
                  style={{ width: 3, height: 3, display: "inline-block" }}
                />
                <span className="font-semibold" style={{ fontSize: 13, color: "#2D6A4F" }}>
                  {formatCurrency(Number(service.price))}
                </span>
              </div>
              {service.description && (
                <p className="text-neutral-400 mt-1 line-clamp-2" style={{ fontSize: 12 }}>
                  {service.description}
                </p>
              )}
            </div>

            {/* Seta */}
            <div
              className="shrink-0 flex items-center justify-center font-semibold"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#F0FDF4",
                color: "#2D6A4F",
                fontSize: 14,
              }}
            >
              →
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
