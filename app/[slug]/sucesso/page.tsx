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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 18px 32px", gap: 0 }}>

      {/* Check */}
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 16, color: "var(--color-primary-dark, #1B4332)" }}>✓</span>
      </div>

      {/* Título e serviço */}
      <p style={{ fontSize: 17, fontWeight: 600, color: "#111827", margin: "0 0 2px", textAlign: "center" }}>
        Agendamento confirmado!
      </p>
      <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 4px" }}>
        {decodeURIComponent(service)}
      </p>

      {/* Data e horário */}
      <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 2px" }}>{dateLabel}</p>
      <p style={{ fontSize: 22, fontWeight: 600, color: "var(--color-primary)", letterSpacing: "-0.5px", margin: "0 0 20px" }}>
        {time}
      </p>

      {/* Card do código — 68% largura */}
      <div style={{
        width: "68%",
        background: "var(--color-primary-light)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 30%, white)",
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        marginBottom: 18,
      }}>
        <p style={{ fontSize: 9, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
          Código para cancelar
        </p>
        <CopyCodeButton code={token} />
      </div>

      {/* Botões de calendário */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", width: "100%", padding: "11px", borderRadius: 12, background: "var(--color-primary)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, textAlign: "center", textDecoration: "none" }}
        >
          Google Calendar
        </a>
        <a
          href={icsUrl}
          style={{ display: "block", width: "100%", padding: "10px", borderRadius: 12, background: "#fff", color: "#111827", border: "1.5px solid #E9EDE9", fontSize: 13, fontWeight: 500, textAlign: "center", textDecoration: "none" }}
        >
          Apple Calendar / Outlook (.ics)
        </a>
      </div>

      {/* Links */}
      <Link href={`/${slug}`} style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none" }}>
        Fazer outro agendamento
      </Link>
      <Link href={`/${slug}/meu-agendamento`} style={{ fontSize: 11, color: "#D1D5DB", textDecoration: "none", marginTop: 4 }}>
        Meu agendamento
      </Link>
    </div>
  )
}
