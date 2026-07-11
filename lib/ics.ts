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

const TZID = "America/Sao_Paulo"

// Formata como YYYYMMDDTHHMMSS (sem Z) no fuso de São Paulo
function formatIcsDateLocal(date: Date): string {
  // Converte para horário de Brasília (UTC-3, sem DST atualmente)
  const brt = new Date(date.getTime() - 3 * 60 * 60 * 1000)
  return brt.toISOString().replace(/[-:]/g, "").split(".")[0]
}

function formatIcsDateUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n")
}

const VTIMEZONE_SAO_PAULO = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:STANDARD",
  "TZNAME:BRT",
  "TZOFFSETFROM:-0200",
  "TZOFFSETTO:-0300",
  "DTSTART:19710404T000000",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n")

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
    VTIMEZONE_SAO_PAULO,
    "BEGIN:VEVENT",
    `UID:${uid}@agendamento`,
    `DTSTAMP:${formatIcsDateUtc(new Date())}`,
    `DTSTART;TZID=${TZID}:${formatIcsDateLocal(startTime)}`,
    `DTEND;TZID=${TZID}:${formatIcsDateLocal(endTime)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)

  return lines.join("\r\n")
}
