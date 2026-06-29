"use client"

import { useRouter } from "next/navigation"

interface BookingHeaderProps {
  establishmentName: string
  establishmentDescription?: string | null
  // contexto acumulado — opcionais
  serviceName?: string
  serviceLabel?: string // "60 min · R$ 300,00"
  dateLabel?: string    // "Segunda, 30 jun · 09:00"
  slug?: string
}

export function BookingHeader({
  establishmentName,
  establishmentDescription,
  serviceName,
  serviceLabel,
  dateLabel,
  slug,
}: BookingHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-primary px-4 pt-8 pb-4 flex flex-col gap-3">
      {/* Nome do estabelecimento */}
      <div>
        <h1 className="text-white text-base font-bold leading-tight">{establishmentName}</h1>
        {establishmentDescription && !serviceName && (
          <p className="text-white/70 text-xs mt-0.5">{establishmentDescription}</p>
        )}
      </div>

      {/* Contexto acumulado — aparece a partir da tela 2 */}
      {serviceName && (
        <div className="bg-white/10 rounded-md px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">{serviceName}</p>
            {serviceLabel && (
              <p className="text-white/70 text-xs mt-0.5">{serviceLabel}</p>
            )}
            {dateLabel && (
              <p className="text-white/80 text-xs mt-0.5">📅 {dateLabel}</p>
            )}
          </div>
          {slug && (
            <button
              onClick={() => router.push(`/${slug}`)}
              className="text-white/70 text-xs underline hover:text-white transition-colors ml-4 shrink-0"
            >
              Trocar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
