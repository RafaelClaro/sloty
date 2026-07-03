import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendBookingReminder } from "@/lib/reminder"
import { GET as getCronLembretes } from "@/app/api/cron/lembretes/route"

vi.mock("@/lib/reminder", () => ({
  sendBookingReminder: vi.fn(),
}))

const mockedSendReminder = vi.mocked(sendBookingReminder)

const TEST_PREFIX = "ci-cron-"
const slug = `${TEST_PREFIX}${Date.now()}`

let establishmentId: string
let serviceId: string

function tomorrowAt(hourUTC: number) {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, hourUTC, 0, 0))
  return d
}

beforeAll(async () => {
  const establishment = await prisma.establishment.create({
    data: { slug, name: "CI Cron Clinic", timezone: "America/Sao_Paulo" },
  })
  establishmentId = establishment.id

  const service = await prisma.service.create({
    data: { establishmentId, name: "Consulta CI", durationMinutes: 30, price: 100, active: true },
  })
  serviceId = service.id
})

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId } })
  mockedSendReminder.mockClear()
})

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId } })
  await prisma.service.deleteMany({ where: { establishmentId } })
  await prisma.establishment.deleteMany({ where: { id: establishmentId } })
})

describe("GET /api/cron/lembretes", () => {
  it("sem CRON_SECRET correto retorna 401", async () => {
    const req = new NextRequest("http://localhost/api/cron/lembretes", {
      headers: { authorization: "Bearer secret-errado" },
    })
    const res = await getCronLembretes(req)
    expect(res.status).toBe(401)
    expect(mockedSendReminder).not.toHaveBeenCalled()
  })

  it("dispara lembrete para booking confirmado de amanhã com clientEmail", async () => {
    await prisma.booking.create({
      data: {
        establishmentId,
        serviceId,
        clientName: "Cliente Amanhã",
        clientPhone: "11999999999",
        clientEmail: "cliente@exemplo.com",
        startTime: tomorrowAt(15),
        endTime: tomorrowAt(15),
        cancelToken: "CRONTOKEN1",
        status: "CONFIRMED",
      },
    })

    const req = new NextRequest("http://localhost/api/cron/lembretes", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    const res = await getCronLembretes(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sent).toBe(1)
    expect(mockedSendReminder).toHaveBeenCalledTimes(1)
  })

  it("não envia lembrete para booking sem clientEmail", async () => {
    await prisma.booking.create({
      data: {
        establishmentId,
        serviceId,
        clientName: "Cliente Sem Email",
        clientPhone: "11999999999",
        startTime: tomorrowAt(16),
        endTime: tomorrowAt(16),
        cancelToken: "CRONTOKEN2",
        status: "CONFIRMED",
      },
    })

    const req = new NextRequest("http://localhost/api/cron/lembretes", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    const res = await getCronLembretes(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(0)
    expect(mockedSendReminder).not.toHaveBeenCalled()
  })

  it("não envia lembrete para booking cancelado", async () => {
    await prisma.booking.create({
      data: {
        establishmentId,
        serviceId,
        clientName: "Cliente Cancelado",
        clientPhone: "11999999999",
        clientEmail: "cancelado@exemplo.com",
        startTime: tomorrowAt(17),
        endTime: tomorrowAt(17),
        cancelToken: "CRONTOKEN3",
        status: "CANCELLED",
      },
    })

    const req = new NextRequest("http://localhost/api/cron/lembretes", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    const res = await getCronLembretes(req)
    const data = await res.json()

    expect(data.total).toBe(0)
    expect(mockedSendReminder).not.toHaveBeenCalled()
  })
})
