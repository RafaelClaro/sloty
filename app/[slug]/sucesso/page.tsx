import Link from "next/link"
import { CopyCodeButton } from "./CopyCodeButton"

export default async function SucessoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token: string; service: string; date: string; time: string }>
}) {
  const { slug } = await params
  const { token, service, date, time } = await searchParams

  const dateLabel = new Date(`${date}T12:00`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  const [h, m] = time.split(":").map(Number)

  const startISO = `${date.replace(/-/g, "")}T${time.replace(":", "")}00`
  const endISO = `${date.replace(/-/g, "")}T${String(h + 1).padStart(2, "0")}${String(m).padStart(2, "0")}00`
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(decodeURIComponent(service))}&dates=${startISO}/${endISO}`

  const icsUrl = `/api/${slug}/ics?token=${encodeURIComponent(token)}&service=${encodeURIComponent(service)}&date=${date}&time=${time}`

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center shadow-card">
        <span className="text-primary text-3xl">✓</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-neutral-900">Consulta confirmada!</h2>
        <p className="text-sm text-neutral-500 mt-1">{decodeURIComponent(service)}</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-semibold text-neutral-900 capitalize">{dateLabel}</p>
        <p className="text-2xl font-bold text-primary">{time}</p>
      </div>

      <div className="flex flex-col items-center gap-1 bg-gradient-to-b from-neutral-100 to-white border border-neutral-300
                      rounded-2xl py-4 px-6 w-full shadow-card">
        <p className="text-xs text-neutral-500 flex items-center gap-1">✉️ CÓDIGO PARA CANCELAR</p>
        <p className="text-2xl font-bold text-neutral-900 tracking-[0.2em] mt-1">{token}</p>
        <CopyCodeButton code={token} />
      </div>

      <div className="flex flex-col gap-3 w-full pt-2">
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-primary text-white rounded-2xl py-3 text-sm
                     font-semibold text-center hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          📅 Google Calendar
        </a>

        <a
          href={icsUrl}
          className="w-full border border-primary text-primary rounded-2xl py-3 text-sm
                     font-semibold text-center hover:bg-primary-light active:scale-[0.98] transition-all"
        >
          🍎 Apple Calendar / Outlook (.ics)
        </a>

        <Link href={`/${slug}`} className="text-sm text-neutral-500 text-center">
          Fazer outro agendamento
        </Link>

        <Link href={`/${slug}/cancelar`} className="text-xs text-neutral-400 text-center">
          Cancelar este agendamento
        </Link>
      </div>
    </div>
  )
}
