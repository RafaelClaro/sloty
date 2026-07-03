import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { POST as postBooking } from "@/app/api/[slug]/bookings/route"
import { POST as postCancel } from "@/app/api/[slug]/bookings/cancel/route"

const TEST_PREFIX = "ci-bookings-"
const slug = `${TEST_PREFIX}${Date.now()}`

let establishmentId: string
let serviceId: string

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeAll(async () => {
  const establishment = await prisma.establishment.create({
    data: {
      slug,
      name: "CI Test Clinic",
      timezone: "America/Sao_Paulo",
    },
  })
  establishmentId = establishment.id

  const service = await prisma.service.create({
    data: {
      establishmentId,
      name: "Consulta CI",
      durationMinutes: 60,
      price: 100,
      active: true,
    },
  })
  serviceId = service.id

  await prisma.availability.create({
    data: {
      establishmentId,
      dayOfWeek: new Date("2099-06-15T15:00:00.000Z").getUTCDay(),
      startTime: "09:00",
      endTime: "18:00",
      active: true,
    },
  })
})

beforeEach(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId } })
})

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { establishmentId } })
  await prisma.availability.deleteMany({ where: { establishmentId } })
  await prisma.service.deleteMany({ where: { establishmentId } })
  await prisma.establishment.deleteMany({ where: { id: establishmentId } })
})

describe("POST /api/[slug]/bookings", () => {
  it("com dados válidos retorna 201 + cancelToken", async () => {
    const req = makeRequest(`http://localhost/api/${slug}/bookings`, {
      serviceId,
      startTime: "2099-06-15T15:00:00.000Z",
      clientName: "Maria da Silva",
      clientPhone: "11999999999",
    })

    const res = await postBooking(req, { params: Promise.resolve({ slug }) })
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.cancelToken).toBeTruthy()
  })

  it("com slot já ocupado retorna 409", async () => {
    const startTime = "2099-06-15T15:00:00.000Z"

    const first = makeRequest(`http://localhost/api/${slug}/bookings`, {
      serviceId, startTime, clientName: "Cliente 1", clientPhone: "11999999999",
    })
    await postBooking(first, { params: Promise.resolve({ slug }) })

    const second = makeRequest(`http://localhost/api/${slug}/bookings`, {
      serviceId, startTime, clientName: "Cliente 2", clientPhone: "11988888888",
    })
    const res = await postBooking(second, { params: Promise.resolve({ slug }) })

    expect(res.status).toBe(409)
  })

  it("com slug inválido retorna 404", async () => {
    const req = makeRequest("http://localhost/api/slug-inexistente/bookings", {
      serviceId,
      startTime: "2099-06-15T15:00:00.000Z",
      clientName: "Maria da Silva",
      clientPhone: "11999999999",
    })

    const res = await postBooking(req, { params: Promise.resolve({ slug: "slug-inexistente" }) })

    expect(res.status).toBe(404)
  })

  it("sem campos obrigatórios retorna 400", async () => {
    const req = makeRequest(`http://localhost/api/${slug}/bookings`, {
      serviceId,
      // faltando startTime, clientName, clientPhone
    })

    const res = await postBooking(req, { params: Promise.resolve({ slug }) })

    expect(res.status).toBe(400)
  })
})

describe("POST /api/[slug]/bookings/cancel", () => {
  async function createBooking() {
    const req = makeRequest(`http://localhost/api/${slug}/bookings`, {
      serviceId,
      startTime: "2099-06-16T15:00:00.000Z",
      clientName: "Cliente Cancelamento",
      clientPhone: "11999999999",
    })
    const res = await postBooking(req, { params: Promise.resolve({ slug }) })
    return res.json()
  }

  it("com token válido retorna 200", async () => {
    const { cancelToken } = await createBooking()

    const req = makeRequest(`http://localhost/api/${slug}/bookings/cancel`, { cancelToken })
    const res = await postCancel(req, { params: Promise.resolve({ slug }) })

    expect(res.status).toBe(200)
  })

  it("com token inválido retorna 404", async () => {
    const req = makeRequest(`http://localhost/api/${slug}/bookings/cancel`, {
      cancelToken: "TOKENINVALIDO",
    })
    const res = await postCancel(req, { params: Promise.resolve({ slug }) })

    expect(res.status).toBe(404)
  })

  it("em agendamento já cancelado retorna 400", async () => {
    const { cancelToken } = await createBooking()

    const firstCancel = makeRequest(`http://localhost/api/${slug}/bookings/cancel`, { cancelToken })
    await postCancel(firstCancel, { params: Promise.resolve({ slug }) })

    const secondCancel = makeRequest(`http://localhost/api/${slug}/bookings/cancel`, { cancelToken })
    const res = await postCancel(secondCancel, { params: Promise.resolve({ slug }) })

    expect(res.status).toBe(400)
  })
})
