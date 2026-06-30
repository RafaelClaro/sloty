/**
 * Gera um arquivo .ics (iCalendar) para anexar no email.
 * Abrindo o anexo, o evento cai direto na agenda do email/calendário da pessoa
 * (Gmail, Outlook, Apple Mail — todos reconhecem .ics nativamente).
 */
interface IcsEventParams {
  uid: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  location?: string
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n")
}

export function generateIcsEvent({
  uid,
  title,
  description,
  startTime,
  endTime,
  location,
}: IcsEventParams): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@agendamento`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startTime)}`,
    `DTEND:${formatIcsDate(endTime)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)

  return lines.join("\r\n")
}
