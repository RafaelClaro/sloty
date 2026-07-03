import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { GET as getServices, POST as postService } from "@/app/api/admin/services/route"
import { PATCH as patchService, DELETE as deleteService } from "@/app/api/admin/services/[id]/route"
import { GET as getAvailabilityRules, PUT as putAvailabilityRules } from "@/app/api/admin/availability-rules/route"
import { GET as getEstablishment, PATCH as patchEstablishment } from "@/app/api/admin/establishment/route"
import { PATCH as patchBooking } from "@/app/api/admin/bookings/[id]/route"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

const mockedGetServerSession = vi.mocked(getServerSession)

const TEST_PREFIX = "ci-admin-crud-"

let establishmentA: { id: string; slug: string }
let establishmentB: { id: string; slug: string }
let serviceAId: string

function sessionFor(establishmentId: string, establishmentSlug: string) {
  return { user: { establishmentId, establishmentSlug } } as never
}

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeAll(async () => {
  const estA = await prisma.establishment.create({
    data: { slug: `${TEST_PREFIX}a-${Date.now()}`, name: "CI Admin A", timezone: "America/Sao_Paulo" },
  })
  const estB = await prisma.establishment.create({
    data: { slug: `${TEST_PREFIX}b-${Date.now()}`, name: "CI Admin B", timezone: "America/Sao_Paulo" },
  })
  establishmentA = { id: estA.id, slug: estA.slug }
  establishmentB = { id: estB.id, slug: estB.slug }

  const serviceA = await prisma.service.create({
    data: { establishmentId: establishmentA.id, name: "Serviço A", durationMinutes: 30, price: 100, active: true },
  })
  serviceAId = serviceA.id
})

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId: { in: [establishmentA.id, establishmentB.id] } } })
  await prisma.availability.deleteMany({ where: { establishmentId: { in: [establishmentA.id, establishmentB.id] } } })
  await prisma.service.deleteMany({ where: { establishmentId: { in: [establishmentA.id, establishmentB.id] } } })
  await prisma.establishment.deleteMany({ where: { id: { in: [establishmentA.id, establishmentB.id] } } })
})

describe("/api/admin/services", () => {
  it("GET lista só os serviços do estabelecimento autenticado", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const res = await getServices()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.services.some((s: { id: string }) => s.id === serviceAId)).toBe(true)
  })

  it("POST cria um novo serviço para o estabelecimento autenticado", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest("http://localhost/api/admin/services", "POST", {
      name: "Novo serviço", durationMinutes: "45", price: 200,
    })
    const res = await postService(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.service.establishmentId).toBe(establishmentA.id)

    await prisma.service.delete({ where: { id: data.service.id } })
  })

  it("POST sem campos obrigatórios retorna 400", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest("http://localhost/api/admin/services", "POST", { name: "Incompleto" })
    const res = await postService(req)
    expect(res.status).toBe(400)
  })
})

describe("/api/admin/services/[id]", () => {
  it("PATCH atualiza um serviço do próprio estabelecimento", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest(`http://localhost/api/admin/services/${serviceAId}`, "PATCH", { name: "Atualizado" })
    const res = await patchService(req, { params: Promise.resolve({ id: serviceAId }) })

    expect(res.status).toBe(200)

    const updated = await prisma.service.findUnique({ where: { id: serviceAId } })
    expect(updated?.name).toBe("Atualizado")
  })

  it("PATCH em serviço de outro estabelecimento retorna 404 (isolamento)", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest(`http://localhost/api/admin/services/${serviceAId}`, "PATCH", { name: "Hackeado" })
    const res = await patchService(req, { params: Promise.resolve({ id: serviceAId }) })

    expect(res.status).toBe(404)

    const untouched = await prisma.service.findUnique({ where: { id: serviceAId } })
    expect(untouched?.name).not.toBe("Hackeado")
  })

  it("DELETE marca o serviço como inativo (soft delete)", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest(`http://localhost/api/admin/services/${serviceAId}`, "DELETE")
    const res = await deleteService(req, { params: Promise.resolve({ id: serviceAId }) })

    expect(res.status).toBe(200)

    const deleted = await prisma.service.findUnique({ where: { id: serviceAId } })
    expect(deleted?.active).toBe(false)
  })
})

describe("/api/admin/availability-rules", () => {
  it("PUT substitui as regras do estabelecimento autenticado", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest("http://localhost/api/admin/availability-rules", "PUT", {
      rules: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", active: true },
        { dayOfWeek: 2, startTime: "08:00", endTime: "17:00", active: true },
      ],
    })
    const res = await putAvailabilityRules(req)
    expect(res.status).toBe(200)

    const rules = await prisma.availability.findMany({ where: { establishmentId: establishmentA.id } })
    expect(rules).toHaveLength(2)
  })

  it("GET retorna só as regras do estabelecimento autenticado", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const res = await getAvailabilityRules()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.rules.every((r: { dayOfWeek: number }) => [1, 2].includes(r.dayOfWeek))).toBe(true)
  })

  it("PUT não afeta as regras de outro estabelecimento (isolamento)", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest("http://localhost/api/admin/availability-rules", "PUT", {
      rules: [{ dayOfWeek: 3, startTime: "10:00", endTime: "12:00", active: true }],
    })
    await putAvailabilityRules(req)

    const rulesA = await prisma.availability.findMany({ where: { establishmentId: establishmentA.id } })
    expect(rulesA).toHaveLength(2)
  })
})

describe("/api/admin/establishment", () => {
  it("GET retorna os dados do estabelecimento autenticado", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const res = await getEstablishment()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.establishment.slug).toBe(establishmentA.slug)
  })

  it("PATCH atualiza o notifyEmail", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest("http://localhost/api/admin/establishment", "PATCH", {
      notifyEmail: "novo@exemplo.com",
    })
    const res = await patchEstablishment(req)
    expect(res.status).toBe(200)

    const updated = await prisma.establishment.findUnique({ where: { id: establishmentA.id } })
    expect(updated?.notifyEmail).toBe("novo@exemplo.com")
  })
})

describe("/api/admin/bookings/[id]", () => {
  it("PATCH cancela um booking do próprio estabelecimento", async () => {
    const booking = await prisma.booking.create({
      data: {
        establishmentId: establishmentA.id,
        serviceId: serviceAId,
        clientName: "Cliente Teste",
        clientPhone: "11999999999",
        startTime: new Date("2099-07-01T15:00:00.000Z"),
        endTime: new Date("2099-07-01T15:30:00.000Z"),
        cancelToken: "ADMINCANCEL1",
        status: "CONFIRMED",
      },
    })

    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = jsonRequest(`http://localhost/api/admin/bookings/${booking.id}`, "PATCH")
    const res = await patchBooking(req, { params: Promise.resolve({ id: booking.id }) })

    expect(res.status).toBe(200)

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(updated?.status).toBe("CANCELLED")
  })

  it("PATCH em booking de outro estabelecimento retorna 404 (isolamento)", async () => {
    const booking = await prisma.booking.create({
      data: {
        establishmentId: establishmentA.id,
        serviceId: serviceAId,
        clientName: "Cliente Teste 2",
        clientPhone: "11999999999",
        startTime: new Date("2099-07-02T15:00:00.000Z"),
        endTime: new Date("2099-07-02T15:30:00.000Z"),
        cancelToken: "ADMINCANCEL2",
        status: "CONFIRMED",
      },
    })

    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest(`http://localhost/api/admin/bookings/${booking.id}`, "PATCH")
    const res = await patchBooking(req, { params: Promise.resolve({ id: booking.id }) })

    expect(res.status).toBe(404)

    const untouched = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(untouched?.status).toBe("CONFIRMED")
  })
})
