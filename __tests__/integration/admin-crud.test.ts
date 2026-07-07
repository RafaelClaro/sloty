import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { GET as getServices, POST as postService } from "@/app/api/admin/services/route"
import { PATCH as patchService, DELETE as deleteService } from "@/app/api/admin/services/[id]/route"
import { GET as getAvailabilityRules, PUT as putAvailabilityRules } from "@/app/api/admin/availability-rules/route"
import { GET as getEstablishment, PATCH as patchEstablishment } from "@/app/api/admin/establishment/route"
import { PATCH as patchBooking } from "@/app/api/admin/bookings/[id]/route"
import { GET as getHistory } from "@/app/api/admin/bookings/history/route"
import { GET as getNotes, PUT as putNotes } from "@/app/api/admin/patients/notes/route"
import { PATCH as patchPassword } from "@/app/api/admin/password/route"

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

  it("GET /history retorna consultas anteriores do mesmo telefone excluindo o atual", async () => {
    const phone = "11988887777"
    const b1 = await prisma.booking.create({
      data: {
        establishmentId: establishmentA.id,
        serviceId: serviceAId,
        clientName: "Paciente Histórico",
        clientPhone: phone,
        startTime: new Date("2099-06-01T10:00:00.000Z"),
        endTime: new Date("2099-06-01T10:30:00.000Z"),
        cancelToken: "HIST001",
        status: "CONFIRMED",
      },
    })
    const b2 = await prisma.booking.create({
      data: {
        establishmentId: establishmentA.id,
        serviceId: serviceAId,
        clientName: "Paciente Histórico",
        clientPhone: phone,
        startTime: new Date("2099-06-02T10:00:00.000Z"),
        endTime: new Date("2099-06-02T10:30:00.000Z"),
        cancelToken: "HIST002",
        status: "CONFIRMED",
      },
    })

    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = new NextRequest(`http://localhost/api/admin/bookings/history?phone=${phone}&excludeId=${b2.id}`)
    const res = await getHistory(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.bookings).toHaveLength(1)
    expect(data.bookings[0].id).toBe(b1.id)
  })

  it("GET /history não vaza bookings de outro estabelecimento", async () => {
    const phone = "11977776666"
    await prisma.booking.create({
      data: {
        establishmentId: establishmentB.id,
        serviceId: serviceAId,
        clientName: "Outro Est",
        clientPhone: phone,
        startTime: new Date("2099-06-03T10:00:00.000Z"),
        endTime: new Date("2099-06-03T10:30:00.000Z"),
        cancelToken: "HIST003",
        status: "CONFIRMED",
      },
    })

    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = new NextRequest(`http://localhost/api/admin/bookings/history?phone=${phone}`)
    const res = await getHistory(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.bookings).toHaveLength(0)
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

describe("/api/admin/patients/notes", () => {
  let bookingForNotes: { id: string }

  beforeAll(async () => {
    bookingForNotes = await prisma.booking.create({
      data: {
        establishmentId: establishmentA.id,
        serviceId: serviceAId,
        clientName: "Paciente Notas",
        clientPhone: "11933332222",
        startTime: new Date("2099-08-01T10:00:00.000Z"),
        endTime: new Date("2099-08-01T10:30:00.000Z"),
        cancelToken: "NOTES001",
        status: "CONFIRMED",
      },
    })
  })

  it("GET retorna string vazia quando não há nota", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const req = new NextRequest(`http://localhost/api/admin/patients/notes?bookingId=${bookingForNotes.id}`)
    const res = await getNotes(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.notes).toBe("")
  })

  it("PUT salva nota e GET retorna o conteúdo", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentA.id, establishmentA.slug))
    const putReq = jsonRequest("http://localhost/api/admin/patients/notes", "PUT", { bookingId: bookingForNotes.id, notes: "15/07 · retorno positivo" })
    const putRes = await putNotes(putReq)
    expect(putRes.status).toBe(200)

    const getReq = new NextRequest(`http://localhost/api/admin/patients/notes?bookingId=${bookingForNotes.id}`)
    const getRes = await getNotes(getReq)
    const data = await getRes.json()
    expect(data.notes).toBe("15/07 · retorno positivo")
  })

  it("notas de booking de outro estabelecimento retornam 404", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = new NextRequest(`http://localhost/api/admin/patients/notes?bookingId=${bookingForNotes.id}`)
    const res = await getNotes(req)
    expect(res.status).toBe(404)
  })
})

describe("/api/admin/password", () => {
  let userId: string
  const initialHash = "$2a$12$testhash" // placeholder — criamos user com bcrypt real abaixo

  beforeAll(async () => {
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("senhaantiga123", 12)
    const user = await prisma.user.create({
      data: {
        establishmentId: establishmentB.id,
        email: `pw-test-${Date.now()}@ci.test`,
        passwordHash: hash,
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it("rejeita sem sessão", async () => {
    mockedGetServerSession.mockResolvedValue(null)
    const req = jsonRequest("http://localhost/api/admin/password", "PATCH", { currentPassword: "x", newPassword: "y" })
    const res = await patchPassword(req)
    expect(res.status).toBe(401)
  })

  it("rejeita senha atual incorreta", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest("http://localhost/api/admin/password", "PATCH", { currentPassword: "errada", newPassword: "novasenha123" })
    const res = await patchPassword(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/incorreta/)
  })

  it("rejeita nova senha com menos de 8 chars", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest("http://localhost/api/admin/password", "PATCH", { currentPassword: "senhaantiga123", newPassword: "curta" })
    const res = await patchPassword(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/8 caracteres/)
  })

  it("altera senha com sucesso", async () => {
    mockedGetServerSession.mockResolvedValue(sessionFor(establishmentB.id, establishmentB.slug))
    const req = jsonRequest("http://localhost/api/admin/password", "PATCH", { currentPassword: "senhaantiga123", newPassword: "novasenha456" })
    const res = await patchPassword(req)
    expect(res.status).toBe(200)

    const bcrypt = await import("bcryptjs")
    const updated = await prisma.user.findUnique({ where: { id: userId } })
    expect(await bcrypt.compare("novasenha456", updated!.passwordHash)).toBe(true)
  })
})
