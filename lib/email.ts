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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `📅 Novo agendamento — ${clientName} em ${dateLabel}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #2D6A4F; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Novo agendamento</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">${establishmentName}</p>
          </div>
          <div style="border: 1px solid #D1D5DB; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
            <table style="width: 100%; font-size: 14px; color: #1A1A2E;">
              <tr><td style="padding: 6px 0; color: #6B7280;">Cliente</td><td style="padding: 6px 0; font-weight: 600;">${clientName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">WhatsApp</td><td style="padding: 6px 0;">${clientPhone}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Serviço</td><td style="padding: 6px 0;">${serviceName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Valor</td><td style="padding: 6px 0; color: #2D6A4F; font-weight: 600;">${formatCurrency(servicePrice)}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Data</td><td style="padding: 6px 0; font-weight: 600;">${dateLabel}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Horário</td><td style="padding: 6px 0; font-weight: 600;">${timeLabel}</td></tr>
            </table>

            <p style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px;">
              Adicionar à agenda
            </p>
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
              <tr>
                <td>
                  <a href="${googleCalendarUrl}" target="_blank"
                     style="display: block; text-align: center; background: #2D6A4F; color: #fff;
                            text-decoration: none; font-size: 13px; font-weight: 600;
                            padding: 10px 16px; border-radius: 8px;">
                    📅 Google Calendar
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">
              🍎 Usa iPhone/Mac? Abra o arquivo anexo a este email (<strong>agendamento.ics</strong>)
              para adicionar direto no Calendário da Apple — também funciona com Outlook e qualquer
              outro app de calendário.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
        },
      ],
    })
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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `✓ Agendamento confirmado — ${dateLabel}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #2D6A4F; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Agendamento confirmado!</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">${establishmentName}</p>
          </div>
          <div style="border: 1px solid #D1D5DB; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
            <p style="font-size: 14px; color: #1A1A2E;">Olá, ${clientName}! Seu agendamento está confirmado:</p>
            <table style="width: 100%; font-size: 14px; color: #1A1A2E; margin-top: 8px;">
              <tr><td style="padding: 6px 0; color: #6B7280;">Serviço</td><td style="padding: 6px 0; font-weight: 600;">${serviceName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Data</td><td style="padding: 6px 0; font-weight: 600;">${dateLabel}</td></tr>
              <tr><td style="padding: 6px 0; color: #6B7280;">Horário</td><td style="padding: 6px 0; font-weight: 600;">${timeLabel}</td></tr>
            </table>

            <p style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 8px;">
              Adicionar à agenda
            </p>
            <a href="${googleCalendarUrl}" target="_blank"
               style="display: block; text-align: center; background: #2D6A4F; color: #fff;
                      text-decoration: none; font-size: 13px; font-weight: 600;
                      padding: 10px 16px; border-radius: 8px;">
              📅 Google Calendar
            </a>
            <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">
              🍎 Usa iPhone/Mac? Abra o arquivo anexo a este email (<strong>agendamento.ics</strong>)
              para adicionar direto no Calendário da Apple — também funciona com Outlook e qualquer
              outro app de calendário.
            </p>

            <div style="background: #F9FAF8; border: 1px solid #D1D5DB; border-radius: 8px;
                        padding: 14px; text-align: center; margin-top: 20px;">
              <p style="font-size: 11px; color: #6B7280; margin: 0;">Código para cancelar</p>
              <p style="font-size: 20px; font-weight: 700; color: #1A1A2E; letter-spacing: 0.15em; margin: 4px 0;">
                ${cancelToken}
              </p>
              <a href="${cancelUrl}" style="font-size: 12px; color: #2D6A4F; font-weight: 600;">
                Cancelar este agendamento
              </a>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "agendamento.ics",
          content: Buffer.from(ics.replace(/^﻿/, ""), "utf-8"),
        },
      ],
    })
  } catch (error) {
    console.error("[sendBookingConfirmationToClient] erro ao enviar email:", error)
  }
}
