import { Resend } from "resend"
import { generateIcsEvent } from "@/lib/ics"
import { formatCurrency } from "@/lib/utils"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Agendamento <onboarding@resend.dev>"
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

interface NotifyNewBookingParams {
  toEmail: string
  establishmentName: string
  clientName: string
  clientPhone: string
  serviceName: string
  servicePrice: number
  startTime: Date
  endTime: Date
  bookingId: string
  reason?: string
}

interface ConfirmationToClientParams {
  toEmail: string
  establishmentName: string
  establishmentSlug: string
  clientName: string
  serviceName: string
  startTime: Date
  endTime: Date
  bookingId: string
  cancelToken: string
}

/**
 * Gera a URL de "criar evento" do Google Calendar — abre o Google Calendar
 * já preenchido com data, horário e descrição, pronto pra salvar em 1 clique.
 */
function buildGoogleCalendarUrl(params: {
  title: string
  description: string
  startTime: Date
  endTime: Date
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    details: params.description,
    dates: `${fmt(params.startTime)}/${fmt(params.endTime)}`,
  })
  return `https://calendar.google.com/calendar/render?${query.toString()}`
}

const DARK_MODE_CSS = `
@media (prefers-color-scheme: dark) {
  .em-bg   { background-color: #0f172a !important; }
  .em-card { background-color: #1e293b !important; border-color: #334155 !important; }
  .em-main { color: #f1f5f9 !important; }
  .em-label { color: #94a3b8 !important; }
  .em-muted { color: #64748b !important; }
  .em-green { color: #4ade80 !important; }
  .em-italic { color: #cbd5e1 !important; }
  .em-cancel-box { background-color: #0f172a !important; border-color: #334155 !important; }
  .em-cancel-code { color: #f1f5f9 !important; }
  .em-cancel-link { color: #4ade80 !important; }
}
`

/**
 * Envia email para o estabelecimento avisando sobre um novo agendamento.
 * Oferece dois caminhos pra adicionar na agenda:
 * - Google Calendar: link direto, abre já preenchido
 * - Apple Calendar / Outlook / qualquer outro: anexo .ics, abre nativamente
 */
export async function notifyEstablishmentNewBooking({
  toEmail,
  establishmentName,
  clientName,
  clientPhone,
  serviceName,
  servicePrice,
  startTime,
  endTime,
  bookingId,
  reason,
}: NotifyNewBookingParams) {
  if (!toEmail) return // sem email configurado, não envia

  const dateLabel = startTime.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  })
  const timeLabel = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  })

  const eventTitle = `${serviceName} — ${clientName}`
  const eventDescription = `Cliente: ${clientName}\nTelefone: ${clientPhone}\nServiço: ${serviceName}`

  const ics = generateIcsEvent({
    uid: bookingId,
    title: eventTitle,
    description: eventDescription.replace(/\n/g, "\\n"),
    startTime,
    endTime,
  })

  const googleCalendarUrl = buildGoogleCalendarUrl({
    title: eventTitle,
    description: eventDescription,
    startTime,
    endTime,
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Novo agendamento — ${clientName} em ${dateLabel}`,
      html: `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_MODE_CSS}</style>
</head>
<body style="margin:0;padding:16px;background:#f8fafc;" class="em-bg">
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:#2D6A4F;padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:18px;margin:0;">Novo agendamento</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${establishmentName}</p>
  </div>
  <div class="em-card" style="background:#ffffff;border:1px solid #D1D5DB;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;width:80px;" class="em-label"><span style="color:#6B7280;">Cliente</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${clientName}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">WhatsApp</span></td>
        <td style="padding:6px 0;" class="em-main"><span style="color:#1A1A2E;">${clientPhone}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Serviço</span></td>
        <td style="padding:6px 0;" class="em-main"><span style="color:#1A1A2E;">${serviceName}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Valor</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-green"><span style="color:#2D6A4F;">${formatCurrency(servicePrice)}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Data</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${dateLabel}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Horário</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${timeLabel}</span></td>
      </tr>
      ${reason ? `<tr><td style="padding:6px 0;vertical-align:top;" class="em-label"><span style="color:#6B7280;">Motivo</span></td><td style="padding:6px 0;font-style:italic;" class="em-italic"><span style="color:#374151;">${reason}</span></td></tr>` : ""}
    </table>
    <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;" class="em-muted">
      <span style="color:#6B7280;">Adicionar à agenda</span>
    </p>
    <a href="${googleCalendarUrl}" target="_blank"
       style="display:block;text-align:center;background:#2D6A4F;color:#fff;
              text-decoration:none;font-size:13px;font-weight:600;
              padding:10px 16px;border-radius:8px;">
      Adicionar ao Google Calendar
    </a>
    <p style="font-size:12px;margin-top:8px;" class="em-muted">
      <span style="color:#6B7280;">Usa iPhone/Mac? Abra o arquivo anexo (<strong>agendamento.ics</strong>) para adicionar ao Calendário da Apple — também funciona com Outlook.</span>
    </p>
  </div>
</div>
</body>
</html>`,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
        },
      ],
    })
    if (error) {
      console.error("[notifyEstablishmentNewBooking] Resend recusou o envio:", error)
    }
  } catch (error) {
    // Falha no email nunca deve quebrar o agendamento em si
    console.error("[notifyEstablishmentNewBooking] erro ao enviar email:", error)
  }
}

/**
 * Envia email de confirmação imediata ao paciente após o agendamento.
 * Inclui botão Google Calendar, anexo .ics, código e link de cancelamento.
 */
export async function sendBookingConfirmationToClient({
  toEmail,
  establishmentName,
  establishmentSlug,
  clientName,
  serviceName,
  startTime,
  endTime,
  bookingId,
  cancelToken,
}: ConfirmationToClientParams) {
  console.log("[sendBookingConfirmationToClient] iniciando envio para", toEmail)
  if (!toEmail) return

  const dateLabel = startTime.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  })
  const timeLabel = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  })

  const eventTitle = `${serviceName} — ${establishmentName}`
  const eventDescription = `Estabelecimento: ${establishmentName}\nServiço: ${serviceName}`

  const ics = generateIcsEvent({
    uid: bookingId,
    title: eventTitle,
    description: eventDescription.replace(/\n/g, "\\n"),
    startTime,
    endTime,
  })

  const googleCalendarUrl = buildGoogleCalendarUrl({
    title: eventTitle,
    description: eventDescription,
    startTime,
    endTime,
  })

  const cancelUrl = `${APP_URL}/${establishmentSlug}/cancelar`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Agendamento confirmado — ${dateLabel}`,
      html: `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_MODE_CSS}</style>
</head>
<body style="margin:0;padding:16px;background:#f8fafc;" class="em-bg">
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:#2D6A4F;padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:18px;margin:0;">Agendamento confirmado!</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${establishmentName}</p>
  </div>
  <div class="em-card" style="background:#ffffff;border:1px solid #D1D5DB;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
    <p style="font-size:14px;margin:0 0 8px;" class="em-main">
      <span style="color:#1A1A2E;">Olá, ${clientName}! Seu agendamento está confirmado:</span>
    </p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0;width:80px;" class="em-label"><span style="color:#6B7280;">Serviço</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${serviceName}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Data</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${dateLabel}</span></td>
      </tr>
      <tr>
        <td style="padding:6px 0;" class="em-label"><span style="color:#6B7280;">Horário</span></td>
        <td style="padding:6px 0;font-weight:600;" class="em-main"><span style="color:#1A1A2E;">${timeLabel}</span></td>
      </tr>
    </table>
    <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;" class="em-muted">
      <span style="color:#6B7280;">Adicionar à agenda</span>
    </p>
    <a href="${googleCalendarUrl}" target="_blank"
       style="display:block;text-align:center;background:#2D6A4F;color:#fff;
              text-decoration:none;font-size:13px;font-weight:600;
              padding:10px 16px;border-radius:8px;">
      Adicionar ao Google Calendar
    </a>
    <p style="font-size:12px;margin-top:8px;" class="em-muted">
      <span style="color:#6B7280;">Usa iPhone/Mac? Abra o arquivo anexo (<strong>agendamento.ics</strong>) para adicionar ao Calendário da Apple — também funciona com Outlook.</span>
    </p>
    <div class="em-cancel-box" style="background:#F9FAF8;border:1px solid #D1D5DB;border-radius:8px;padding:14px;text-align:center;margin-top:20px;">
      <p style="font-size:11px;margin:0;" class="em-muted"><span style="color:#6B7280;">Código para cancelar</span></p>
      <p style="font-size:20px;font-weight:700;letter-spacing:0.15em;margin:4px 0;" class="em-cancel-code"><span style="color:#1A1A2E;">${cancelToken}</span></p>
      <a href="${cancelUrl}" style="font-size:12px;color:#2D6A4F;font-weight:600;" class="em-cancel-link">
        Cancelar este agendamento
      </a>
    </div>
  </div>
</div>
</body>
</html>`,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
        },
      ],
    })
    if (error) {
      console.error("[sendBookingConfirmationToClient] Resend recusou o envio:", error)
      return
    }
    console.log("[sendBookingConfirmationToClient] email enviado com sucesso, id:", data?.id)
  } catch (error) {
    console.error("[sendBookingConfirmationToClient] erro ao enviar email:", error)
  }
}
