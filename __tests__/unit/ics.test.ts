import { describe, it, expect } from "vitest"
import { generateIcsEvent } from "@/lib/ics"

const baseParams = {
  uid: "booking-123",
  title: "Consulta médica",
  description: "Cliente: Maria",
  startTime: new Date("2099-06-15T12:00:00.000Z"),
  endTime: new Date("2099-06-15T13:00:00.000Z"),
}

describe("generateIcsEvent", () => {
  it("gera string com BEGIN:VCALENDAR e END:VCALENDAR", () => {
    const ics = generateIcsEvent(baseParams)
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("END:VCALENDAR")
    expect(ics).toContain("BEGIN:VEVENT")
    expect(ics).toContain("END:VEVENT")
  })

  it("DTSTART e DTEND usam TZID=America/Sao_Paulo (horário local BRT)", () => {
    const ics = generateIcsEvent(baseParams)
    // Deve usar TZID, não UTC com Z
    expect(ics).toMatch(/DTSTART;TZID=America\/Sao_Paulo:\d{8}T\d{6}/)
    expect(ics).toMatch(/DTEND;TZID=America\/Sao_Paulo:\d{8}T\d{6}/)
    // 12:00Z = 09:00 BRT (UTC-3)
    expect(ics).toContain("DTSTART;TZID=America/Sao_Paulo:20990615T090000")
    expect(ics).toContain("DTEND;TZID=America/Sao_Paulo:20990615T100000")
    expect(ics).toContain("BEGIN:VTIMEZONE")
  })

  it("SUMMARY contém o título passado", () => {
    const ics = generateIcsEvent(baseParams)
    expect(ics).toContain("SUMMARY:Consulta médica")
  })

  it("caracteres especiais (vírgula, ponto-e-vírgula) são escapados", () => {
    const ics = generateIcsEvent({
      ...baseParams,
      title: "Consulta, retorno; avaliação",
    })
    expect(ics).toContain("SUMMARY:Consulta\\, retorno\\; avaliação")
  })

  it("UID é único por evento", () => {
    const icsA = generateIcsEvent({ ...baseParams, uid: "booking-a" })
    const icsB = generateIcsEvent({ ...baseParams, uid: "booking-b" })

    expect(icsA).toContain("UID:booking-a@agendamento")
    expect(icsB).toContain("UID:booking-b@agendamento")
    expect(icsA).not.toContain("UID:booking-b@agendamento")
  })
})
