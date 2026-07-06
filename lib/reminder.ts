import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Agendamento <onboarding@resend.dev>"
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

interface SendBookingReminderParams {
  toEmail: string
  establishmentName: string
  establishmentSlug: string
  clientName: string
  serviceName: string
  startTime: Date
  cancelToken: string
}

const DARK_CSS = `
@media (prefers-color-scheme: dark) {
  .em-bg    { background-color: #0f172a !important; }
  .em-card  { background-color: #1e293b !important; border-color: #334155 !important; }
  .em-main  { color: #f1f5f9 !important; }
  .em-label { color: #94a3b8 !important; }
  .em-muted { color: #64748b !important; }
  .em-cbox  { background-color: #0f172a !important; border-color: #334155 !important; }
  .em-ccode { color: #f1f5f9 !important; }
  .em-clink { color: #4ade80 !important; }
}
`

export async function sendBookingReminder({
  toEmail,
  establishmentName,
  establishmentSlug,
  clientName,
  serviceName,
  startTime,
  cancelToken,
}: SendBookingReminderParams) {
  if (!toEmail) return

  const dateLabel = startTime.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  })
  const timeLabel = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  })

  const cancelUrl = `${APP_URL}/${establishmentSlug}/cancelar`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Seu agendamento é amanhã, ${dateLabel}`,
    html: `<!DOCTYPE html>
<html><head>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_CSS}</style>
</head>
<body style="margin:0;padding:16px;background:#f8fafc;" class="em-bg">
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:#2D6A4F;padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:18px;margin:0;">Seu agendamento é amanhã!</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${establishmentName}</p>
  </div>
  <div class="em-card" style="background:#ffffff;border:1px solid #D1D5DB;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
    <p class="em-main" style="font-size:14px;margin:0 0 4px;color:#1A1A2E;">Olá, ${clientName}!</p>
    <p class="em-main" style="font-size:14px;margin:0 0 8px;color:#1A1A2E;">
      Passando para lembrar que sua consulta é <strong>amanhã</strong>:
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
    <div class="em-cbox" style="background:#F9FAF8;border:1px solid #D1D5DB;border-radius:8px;padding:14px;text-align:center;margin-top:20px;">
      <p class="em-muted" style="font-size:11px;margin:0;color:#6B7280;">Código para cancelar</p>
      <p class="em-ccode" style="font-size:20px;font-weight:700;letter-spacing:0.15em;margin:4px 0;color:#1A1A2E;">${cancelToken}</p>
      <a href="${cancelUrl}" class="em-clink" style="font-size:12px;color:#2D6A4F;font-weight:600;">
        Cancelar este agendamento
      </a>
    </div>
  </div>
</div>
</body></html>`,
  })

  if (error) {
    throw new Error(`Resend recusou o envio: ${error.message}`)
  }
}
