import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAvailableSlots, getAvailableDaysInMonth } from "@/lib/availability"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    availability: { findFirst: vi.fn(), findMany: vi.fn() },
    service: { findUnique: vi.fn() },
    booking: { findMany: vi.fn() },
    blockedTime: { findMany: vi.fn() },
  },
}))

const mockPrisma = prisma as unknown as {
  availability: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  service: { findUnique: ReturnType<typeof vi.fn> }
  booking: { findMany: ReturnType<typeof vi.fn> }
  blockedTime: { findMany: ReturnType<typeof vi.fn> }
}

describe("getAvailableSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("slot livre retorna { time, available: true }", async () => {
    // Data bem no futuro para não cair no filtro de "isPast"
    const futureDate = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue({
      dayOfWeek: futureDate.getUTCDay(), startTime: "09:00", endTime: "12:00", active: true,
    })
    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    const slots = await getAvailableSlots("est-1", "svc-1", futureDate)

    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toEqual({ time: "09:00", available: true })
  })

  it("slot com booking confirmado retorna { available: false }", async () => {
    const futureDate = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))
    // Slot 09:00 BRT = 12:00 UTC
    const bookedStart = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))
    const bookedEnd = new Date(Date.UTC(2099, 5, 15, 13, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue({
      dayOfWeek: futureDate.getUTCDay(), startTime: "09:00", endTime: "12:00", active: true,
    })
    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    mockPrisma.booking.findMany.mockResolvedValue([{ startTime: bookedStart, endTime: bookedEnd }])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    const slots = await getAvailableSlots("est-1", "svc-1", futureDate)

    expect(slots[0].available).toBe(false)
  })

  it("slot no passado não aparece na grade", async () => {
    // Data fixa e distante no passado — garante que o expediente já
    // encerrou independentemente da hora real em que o teste roda
    // (evita flakiness por causa do horário de execução do CI).
    const pastDate = new Date(Date.UTC(2020, 0, 1, 12, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue({
      dayOfWeek: pastDate.getUTCDay(), startTime: "00:00", endTime: "23:59", active: true,
    })
    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    const slots = await getAvailableSlots("est-1", "svc-1", pastDate)

    expect(slots.every((s) => s.available === false)).toBe(true)
  })

  it("dia sem Availability (fechado) retorna array vazio", async () => {
    const futureDate = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue(null)
    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    const slots = await getAvailableSlots("est-1", "svc-1", futureDate)

    expect(slots).toEqual([])
  })

  it("duração de 60min bloqueia 60min corretamente", async () => {
    const futureDate = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue({
      dayOfWeek: futureDate.getUTCDay(), startTime: "09:00", endTime: "11:00", active: true,
    })
    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    const slots = await getAvailableSlots("est-1", "svc-1", futureDate)

    // 09:00-11:00 com slots de 60min = 09:00 e 10:00 (2 slots)
    expect(slots.map((s) => s.time)).toEqual(["09:00", "10:00"])
  })

  it("duração de 30min gera o dobro de slots que 60min", async () => {
    const futureDate = new Date(Date.UTC(2099, 5, 15, 12, 0, 0))

    mockPrisma.availability.findFirst.mockResolvedValue({
      dayOfWeek: futureDate.getUTCDay(), startTime: "09:00", endTime: "11:00", active: true,
    })
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.blockedTime.findMany.mockResolvedValue([])

    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 60 })
    const slots60 = await getAvailableSlots("est-1", "svc-1", futureDate)

    mockPrisma.service.findUnique.mockResolvedValue({ durationMinutes: 30 })
    const slots30 = await getAvailableSlots("est-1", "svc-1", futureDate)

    expect(slots30.length).toBe(slots60.length * 2)
  })
})

describe("getAvailableDaysInMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna só dias com Availability ativa", async () => {
    // Só segunda-feira (dayOfWeek 1) está ativa, mês bem no futuro
    mockPrisma.availability.findMany.mockResolvedValue([
      { dayOfWeek: 1, endTime: "18:00" },
    ])

    const year = 2099
    const month = 5 // Junho (0-indexed)
    const days = await getAvailableDaysInMonth("est-1", year, month)

    for (const day of days) {
      const date = new Date(year, month, day)
      expect(date.getDay()).toBe(1)
    }
  })

  it("não retorna dias no passado", async () => {
    mockPrisma.availability.findMany.mockResolvedValue([
      { dayOfWeek: 0, endTime: "18:00" },
      { dayOfWeek: 1, endTime: "18:00" },
      { dayOfWeek: 2, endTime: "18:00" },
      { dayOfWeek: 3, endTime: "18:00" },
      { dayOfWeek: 4, endTime: "18:00" },
      { dayOfWeek: 5, endTime: "18:00" },
      { dayOfWeek: 6, endTime: "18:00" },
    ])

    const now = new Date()
    const days = await getAvailableDaysInMonth("est-1", now.getFullYear(), now.getMonth())

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    for (const day of days) {
      const date = new Date(now.getFullYear(), now.getMonth(), day)
      expect(date.getTime()).toBeGreaterThanOrEqual(todayDate.getTime())
    }
  })
})
