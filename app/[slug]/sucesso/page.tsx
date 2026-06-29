import Link from "next/link"
import { Button } from "@/components/ui/Button"

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

      <div className="flex flex-col items-center gap-1 bg-neutral-100 border border-neutral-300 rounded-md py-3 px-6 w-full">
        <p className="text-xs text-neutral-500">Código para cancelar</p>
        <p className="text-xl font-bold text-neutral-900 tracking-widest">{token}</p>
        <p className="text-xs text-neutral-500">Guarde este código se precisar cancelar</p>
      </div>

      <Link href={`/${slug}`} className="w-full">
        <Button variant="ghost" size="lg">📅 Adicionar ao calendário</Button>
      </Link>

      <Link
        href={`/${slug}/cancelar`}
        className="w-full border border-error rounded-md py-3 text-sm font-medium text-error text-center block"
      >
        Cancelar este agendamento
      </Link>
    </div>
  )
}
