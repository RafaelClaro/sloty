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
      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center shadow-card">
        <span className="text-primary text-3xl">✓</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-neutral-900">Consulta agendada!</h2>
        <p className="text-sm text-neutral-500 mt-1">Você vai receber a confirmação em breve</p>
      </div>

      <div className="text-neutral-700 text-sm leading-relaxed bg-white border border-neutral-300 rounded-2xl shadow-card px-5 py-4 w-full">
        <p className="font-bold text-neutral-900">{decodeURIComponent(service)}</p>
        <p className="mt-1">{dateLabel} às {time}</p>
      </div>

      <div className="flex flex-col items-center gap-1 bg-gradient-to-b from-neutral-100 to-white border border-neutral-300
                      rounded-2xl py-4 px-6 w-full shadow-card">
        <p className="text-xs text-neutral-500">Código para cancelar</p>
        <p className="text-2xl font-bold text-primary tracking-[0.2em]">{token}</p>
        <p className="text-xs text-neutral-500">Guarde este código se precisar cancelar</p>
      </div>

      <div className="flex flex-col gap-3 w-full pt-2">
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full border border-primary text-primary rounded-2xl py-3 text-sm
                     font-semibold text-center hover:bg-primary-light active:scale-[0.98] transition-all"
        >
          📅 Adicionar ao Google Calendar
        </a>

        <Link href={`/${slug}/cancelar`} className="text-sm text-error text-center font-medium">
          Cancelar este agendamento
        </Link>

        <Link href={`/${slug}`} className="text-sm text-neutral-500 text-center">
          Fazer outro agendamento
        </Link>
      </div>
    </div>
  )
}
