import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Agendamento <onboarding@resend.dev>"

interface SendBookingReminderParams {
  toEmail: string
  establishmentName: string
  clientName: string
  serviceName: string
  startTime: Date
}

/**
 * Envia lembrete D-1 ao cliente sobre sua consulta do dia seguinte.
 * Chamado pelo cron diário em app/api/cron/lembretes/route.ts.
 */
export async function sendBookingReminder({
  toEmail,
  establishmentName,
  clientName,
  serviceName,
  startTime,
}: SendBookingReminderParams) {
  if (!toEmail) return

  const dateLabel = startTime.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo",
  })
  const timeLabel = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `⏰ Lembrete: sua consulta é amanhã, ${dateLabel}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #2D6A4F; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; font-size: 18px; margin: 0;">Lembrete de consulta</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">${establishmentName}</p>
        </div>
        <div style="border: 1px solid #D1D5DB; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
          <p style="font-size: 14px; color: #1A1A2E;">Olá, ${clientName}!</p>
          <p style="font-size: 14px; color: #1A1A2E;">
            Passando para lembrar que sua consulta é <strong>amanhã</strong>:
          </p>
          <table style="width: 100%; font-size: 14px; color: #1A1A2E; margin-top: 8px;">
            <tr><td style="padding: 6px 0; color: #6B7280;">Serviço</td><td style="padding: 6px 0; font-weight: 600;">${serviceName}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B7280;">Data</td><td style="padding: 6px 0; font-weight: 600;">${dateLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B7280;">Horário</td><td style="padding: 6px 0; font-weight: 600;">${timeLabel}</td></tr>
          </table>
          <p style="font-size: 12px; color: #6B7280; margin-top: 16px;">
            Se precisar cancelar, use o código enviado na confirmação do agendamento.
          </p>
        </div>
      </div>
    `,
  })
}
