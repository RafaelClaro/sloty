import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { GET as getAgenda } from "@/app/api/admin/agenda/route"
import { GET as getServices, POST as postServices } from "@/app/api/admin/services/route"
import { PATCH as patchService } from "@/app/api/admin/services/[id]/route"
import { PUT as putAvailabilityRules } from "@/app/api/admin/availability-rules/route"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

const mockedGetServerSession = vi.mocked(getServerSession)

const TEST_PREFIX = "ci-security-"

let establishmentA: { id: string; slug: string }
let establishmentB: { id: string; slug: string }
let bookingAId: string
let serviceAId: string

beforeAll(async () => {
  const estA = await prisma.establishment.create({
    data: { slug: `${TEST_PREFIX}a-${Date.now()}`, name: "Estabelecimento A", timezone: "America/Sao_Paulo" },
  })
  const estB = await prisma.establishment.create({
    data: { slug: `${TEST_PREFIX}b-${Date.now()}`, name: "Estabelecimento B", timezone: "America/Sao_Paulo" },
  })
  establishmentA = { id: estA.id, slug: estA.slug }
  establishmentB = { id: estB.id, slug: estB.slug }

  const serviceA = await prisma.service.create({
    data: { establishmentId: establishmentA.id, name: "Serviço A", durationMinutes: 30, price: 100, active: true },
  })
  serviceAId = serviceA.id

  const bookingA = await prisma.booking.create({
    data: {
      establishmentId: establishmentA.id,
      serviceId: serviceAId,
      clientName: "Cliente A",
      clientPhone: "11999999999",
      startTime: new Date("2099-06-15T15:00:00.000Z"),
      endTime: new Date("2099-06-15T15:30:00.000Z"),
      cancelToken: "TESTTOKEN01",
      status: "CONFIRMED",
    },
  })
  bookingAId = bookingA.id
})

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId: { in: [establishmentA.id, establishmentB.id] } } })
  await prisma.service.deleteMany({ where: { establishmentId: { in: [establishmentA.id, establishmentB.id] } } })
  await prisma.establishment.deleteMany({ where: { id: { in: [establishmentA.id, establishmentB.id] } } })
})

describe("rotas admin exigem sessão", () => {
  beforeAll(() => {
    mockedGetServerSession.mockResolvedValue(null)
  })

  it("GET /api/admin/agenda sem sessão retorna 401", async () => {
    const req = new NextRequest("http://localhost/api/admin/agenda")
    const res = await getAgenda(req)
    expect(res.status).toBe(401)
  })

  it("GET /api/admin/services sem sessão retorna 401", async () => {
    const res = await getServices()
    expect(res.status).toBe(401)
  })

  it("PATCH /api/admin/services/[id] sem sessão retorna 401", async () => {
    const req = new NextRequest("http://localhost/api/admin/services/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Novo nome" }),
    })
    const res = await patchService(req, { params: Promise.resolve({ id: "abc" }) })
    expect(res.status).toBe(401)
  })

  it("PUT /api/admin/availability-rules sem sessão retorna 401", async () => {
    const req = new NextRequest("http://localhost/api/admin/availability-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: [] }),
    })
    const res = await putAvailabilityRules(req)
    expect(res.status).toBe(401)
  })
})

describe("isolamento multi-tenant", () => {
  it("admin do estabelecimento A não consegue ver bookings do estabelecimento B", async () => {
    // Sessão autenticada como admin do estabelecimento B
    mockedGetServerSession.mockResolvedValue({
      user: { establishmentId: establishmentB.id, establishmentSlug: establishmentB.slug },
    } as never)

    const req = new NextRequest("http://localhost/api/admin/agenda?date=2099-06-15")
    const res = await getAgenda(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    const ids = data.bookings.map((b: { id: string }) => b.id)
    expect(ids).not.toContain(bookingAId)
  })
})
