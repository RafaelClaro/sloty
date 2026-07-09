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
  primaryColor?: string
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
  primaryColor?: string
}

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

// Inline style e classe no mesmo elemento — o !important no @media sobrepõe o inline style
const DARK_CSS = `
@media (prefers-color-scheme: dark) {
  .em-bg        { background-color: #0f172a !important; }
  .em-card      { background-color: #1e293b !important; border-color: #334155 !important; }
  .em-main      { color: #f1f5f9 !important; }
  .em-label     { color: #94a3b8 !important; }
  .em-muted     { color: #64748b !important; }
  .em-green     { color: #4ade80 !important; }
  .em-italic    { color: #cbd5e1 !important; }
  .em-cbox      { background-color: #0f172a !important; border-color: #334155 !important; }
  .em-ccode     { color: #f1f5f9 !important; }
  .em-clink     { color: #4ade80 !important; }
}
`

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
  primaryColor,
}: NotifyNewBookingParams) {
  const headerBg = primaryColor ?? "#2D6A4F"
  if (!toEmail) return

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
<html><head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_CSS}</style>
</head>
<body style="margin:0;padding:16px;background:#f8fafc;" class="em-bg">
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:${headerBg};padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:18px;margin:0;">Novo agendamento</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${establishmentName}</p>
  </div>
  <div class="em-card" style="background:#ffffff;border:1px solid #D1D5DB;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td class="em-label" style="padding:6px 0;width:80px;color:#6B7280;">Cliente</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${clientName}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">WhatsApp</td>
        <td class="em-main" style="padding:6px 0;color:#1A1A2E;">${clientPhone}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Serviço</td>
        <td class="em-main" style="padding:6px 0;color:#1A1A2E;">${serviceName}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Valor</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${formatCurrency(servicePrice)}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Data</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${dateLabel}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Horário</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${timeLabel}</td>
      </tr>
      ${reason ? `<tr><td class="em-label" style="padding:6px 0;vertical-align:top;color:#6B7280;">Motivo</td><td class="em-italic" style="padding:6px 0;font-style:italic;color:#374151;">${reason}</td></tr>` : ""}
    </table>
    <p class="em-muted" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;color:#6B7280;">
      Adicionar à agenda
    </p>
    <a href="${googleCalendarUrl}" target="_blank"
       style="display:block;text-align:center;background:${headerBg};color:#fff;
              text-decoration:none;font-size:13px;font-weight:600;padding:10px 16px;border-radius:8px;">
      Adicionar ao Google Calendar
    </a>
    <p class="em-muted" style="font-size:12px;margin-top:8px;color:#6B7280;">
      Usa iPhone/Mac? Abra o arquivo anexo (<strong>agendamento.ics</strong>) para adicionar ao Calendário da Apple — também funciona com Outlook.
    </p>
  </div>
</div>
</body></html>`,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
          contentType: "text/calendar; charset=utf-8; method=PUBLISH",
        },
      ],
    })
    if (error) {
      console.error("[notifyEstablishmentNewBooking] Resend recusou o envio:", error)
    }
  } catch (error) {
    console.error("[notifyEstablishmentNewBooking] erro ao enviar email:", error)
  }
}

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
  primaryColor,
}: ConfirmationToClientParams) {
  const headerBg = primaryColor ?? "#2D6A4F"
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
  const icsUrl = `${APP_URL}/api/calendar/${cancelToken}`
  const meusAgendamentosUrl = process.env.ROOT_DOMAIN
    ? `https://${establishmentSlug}.${process.env.ROOT_DOMAIN}/meus-agendamentos?token=${cancelToken}`
    : `${APP_URL}/${establishmentSlug}/meus-agendamentos?token=${cancelToken}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Agendamento confirmado — ${dateLabel}`,
      html: `<!DOCTYPE html>
<html><head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_CSS}</style>
</head>
<body style="margin:0;padding:16px;background:#f8fafc;" class="em-bg">
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:${headerBg};padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:18px;margin:0;">Agendamento confirmado!</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${establishmentName}</p>
  </div>
  <div class="em-card" style="background:#ffffff;border:1px solid #D1D5DB;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
    <p class="em-main" style="font-size:14px;margin:0 0 8px;color:#1A1A2E;">
      Olá, ${clientName}! Seu agendamento está confirmado:
    </p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr>
        <td class="em-label" style="padding:6px 0;width:80px;color:#6B7280;">Serviço</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${serviceName}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Data</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${dateLabel}</td>
      </tr>
      <tr>
        <td class="em-label" style="padding:6px 0;color:#6B7280;">Horário</td>
        <td class="em-main" style="padding:6px 0;font-weight:600;color:#1A1A2E;">${timeLabel}</td>
      </tr>
    </table>
    <p class="em-muted" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:20px 0 8px;color:#6B7280;">
      Adicionar à agenda
    </p>
    <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
      <tr>
        <td style="padding-right:4px;">
          <a href="${googleCalendarUrl}" target="_blank"
             style="display:block;text-align:center;background:${headerBg};color:#fff;
                    text-decoration:none;font-size:13px;font-weight:600;padding:10px 12px;border-radius:8px;">
            Google Calendar
          </a>
        </td>
        <td style="padding-left:4px;">
          <a href="${icsUrl}" target="_blank"
             style="display:block;text-align:center;background:#1c1c1e;color:#fff;
                    text-decoration:none;font-size:13px;font-weight:600;padding:10px 12px;border-radius:8px;">
            Apple Calendar
          </a>
        </td>
      </tr>
    </table>
    <div class="em-cbox" style="background:#F9FAF8;border:1px solid #D1D5DB;border-radius:8px;padding:14px;text-align:center;margin-top:12px;">
      <p class="em-muted" style="font-size:11px;margin:0;color:#6B7280;">Código para cancelar</p>
      <p class="em-ccode" style="font-size:20px;font-weight:700;letter-spacing:0.15em;margin:4px 0;color:#1A1A2E;">${cancelToken}</p>
      <a href="${cancelUrl}" class="em-clink" style="font-size:12px;color:${headerBg};font-weight:600;">
        Cancelar este agendamento
      </a>
    </div>
    <div style="border-top:1px solid #E9EDE9;margin-top:20px;padding-top:16px;text-align:center;">
      <p style="font-size:12px;color:#9CA3AF;margin:0 0 10px;">
        Precisa alterar sua consulta?
      </p>
      <a href="${meusAgendamentosUrl}"
         style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#6B7280;text-decoration:underline;text-decoration-style:dotted;">
        📋 Meus agendamentos
      </a>
    </div>
  </div>
</div>
</body></html>`,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
          contentType: "text/calendar; charset=utf-8; method=PUBLISH",
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
