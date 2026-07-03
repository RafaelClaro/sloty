import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { GET as getAvailability } from "@/app/api/[slug]/availability/route"

const TEST_PREFIX = "ci-availability-"
const slug = `${TEST_PREFIX}${Date.now()}`

let establishmentId: string
let serviceId: string

beforeAll(async () => {
  const establishment = await prisma.establishment.create({
    data: { slug, name: "CI Availability Clinic", timezone: "America/Sao_Paulo" },
  })
  establishmentId = establishment.id

  const service = await prisma.service.create({
    data: { establishmentId, name: "Consulta", durationMinutes: 60, price: 100, active: true },
  })
  serviceId = service.id

  // Segunda-feira (2099-06-15 é uma segunda) 09:00-18:00
  await prisma.availability.create({
    data: {
      establishmentId,
      dayOfWeek: new Date("2099-06-15T12:00:00.000Z").getUTCDay(),
      startTime: "09:00",
      endTime: "18:00",
      active: true,
    },
  })
})

afterAll(async () => {
  await prisma.availability.deleteMany({ where: { establishmentId } })
  await prisma.service.deleteMany({ where: { establishmentId } })
  await prisma.establishment.deleteMany({ where: { id: establishmentId } })
})

describe("GET /api/[slug]/availability", () => {
  it("com slug inválido retorna 404", async () => {
    const req = new NextRequest(
      "http://localhost/api/slug-inexistente/availability?serviceId=x&date=2099-06-15"
    )
    const res = await getAvailability(req, { params: Promise.resolve({ slug: "slug-inexistente" }) })
    expect(res.status).toBe(404)
  })

  it("sem serviceId/date retorna 400", async () => {
    const req = new NextRequest(`http://localhost/api/${slug}/availability`)
    const res = await getAvailability(req, { params: Promise.resolve({ slug }) })
    expect(res.status).toBe(400)
  })

  it("com serviceId e date retorna slots do dia", async () => {
    const req = new NextRequest(
      `http://localhost/api/${slug}/availability?serviceId=${serviceId}&date=2099-06-15`
    )
    const res = await getAvailability(req, { params: Promise.resolve({ slug }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.slots)).toBe(true)
    expect(data.slots.length).toBeGreaterThan(0)
    expect(data.slots[0]).toHaveProperty("time")
    expect(data.slots[0]).toHaveProperty("available")
  })

  it("com month/year retorna dias disponíveis do mês", async () => {
    const req = new NextRequest(
      `http://localhost/api/${slug}/availability?month=5&year=2099`
    )
    const res = await getAvailability(req, { params: Promise.resolve({ slug }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.days)).toBe(true)
  })
})
