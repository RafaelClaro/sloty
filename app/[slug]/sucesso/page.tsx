import Link from "next/link"

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

  const startISO = `${date.replace(/-/g, "")}T${time.replace(":", "")}00`
  const [h, m] = time.split(":").map(Number)
  const endH = String(h + 1).padStart(2, "0")
  const endISO = `${date.replace(/-/g, "")}T${endH}${String(m).padStart(2, "0")}00`
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(decodeURIComponent(service))}&dates=${startISO}/${endISO}`

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center">
        <span className="text-primary text-3xl">✓</span>
      </div>

      <h2 className="text-xl font-bold text-neutral-900">Consulta agendada!</h2>

      <div className="text-neutral-700 text-sm leading-relaxed">
        <p className="font-medium">{decodeURIComponent(service)}</p>
        <p>{dateLabel} às {time}</p>
      </div>

      <div className="flex flex-col items-center gap-1 bg-neutral-100 border border-neutral-300
                      rounded-md py-3 px-6 w-full">
        <p className="text-xs text-neutral-500">Código para cancelar</p>
        <p className="text-xl font-bold text-neutral-900 tracking-widest">{token}</p>
        <p className="text-xs text-neutral-500">Guarde este código se precisar cancelar</p>
      </div>

      <div className="flex flex-col gap-3 w-full pt-2">
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full border border-primary text-primary rounded-lg py-3 text-sm
                     font-medium text-center hover:bg-primary-light transition-colors"
        >
          📅 Adicionar ao Google Calendar
        </a>

        <Link href={`/${slug}/cancelar`} className="text-sm text-error text-center">
          Cancelar este agendamento
        </Link>

        <Link href={`/${slug}`} className="text-sm text-neutral-500 text-center">
          Fazer outro agendamento
        </Link>
      </div>
    </div>
  )
}
