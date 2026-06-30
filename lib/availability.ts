import { prisma } from "@/lib/prisma"

interface TimeSlot {
  time: string
  available: boolean
}

interface BookingInterval {
  startTime: Date
  endTime: Date
}

/**
 * Gera slots de disponibilidade para um estabelecimento, serviço e data.
 * Remove slots já ocupados por bookings ou bloqueios manuais.
 */
const TZ = "America/Sao_Paulo"

export async function getAvailableSlots(
  establishmentId: string,
  serviceId: string,
  date: Date
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getUTCDay()
  // Cover the full Brasília day in UTC: BRT = UTC-3, so BRT 00:00 = UTC 03:00
  const y = date.getUTCFullYear()
  const mo = date.getUTCMonth()
  const d = date.getUTCDate()
  const startOfDay = new Date(Date.UTC(y, mo, d, 3, 0, 0))
  const endOfDay = new Date(Date.UTC(y, mo, d + 1, 2, 59, 59))

  const [availability, service, existingBookings, blockedTimes] = await Promise.all([
    prisma.availability.findFirst({
      where: { establishmentId, dayOfWeek, active: true },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.booking.findMany({
      where: {
        establishmentId,
        status: "CONFIRMED",
        startTime: { gte: startOfDay, lt: endOfDay },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.blockedTime.findMany({
      where: {
        establishmentId,
        startTime: { gte: startOfDay, lt: endOfDay },
      },
      select: { startTime: true, endTime: true },
    }),
  ])

  if (!availability || !service) return []

  const slots = generateTimeGrid(
    availability.startTime,
    availability.endTime,
    service.durationMinutes,
    date
  )

  const now = new Date()

  return slots.map((slot) => {
    const slotEnd = new Date(slot.getTime() + service.durationMinutes * 60 * 1000)

    const isBooked = existingBookings.some(
      (b: BookingInterval) => slot < b.endTime && slotEnd > b.startTime
    )
    const isBlocked = blockedTimes.some(
      (b: BookingInterval) => slot < b.endTime && slotEnd > b.startTime
    )
    const isPast = slot <= now

    return {
      time: slot.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }),
      available: !isBooked && !isBlocked && !isPast,
    }
  })
}

/**
 * Gera grade de horários entre startTime e endTime com intervalos de durationMinutes.
 */
function generateTimeGrid(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  date: Date
): Date[] {
  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)

  // Availability rules store times in Brasília (UTC-3).
  // Convert to UTC by adding 3 hours so slot Date objects match
  // bookings which are stored as UTC equivalents of browser local time.
  const y = date.getUTCFullYear()
  const mo = date.getUTCMonth()
  const d = date.getUTCDate()
  const start = new Date(Date.UTC(y, mo, d, startH + 3, startM))
  const end = new Date(Date.UTC(y, mo, d, endH + 3, endM))

  const slots: Date[] = []
  let current = new Date(start)

  while (current.getTime() + durationMinutes * 60 * 1000 <= end.getTime()) {
    slots.push(new Date(current))
    current = new Date(current.getTime() + durationMinutes * 60 * 1000)
  }

  return slots
}

/**
 * Retorna os dias com disponibilidade no mês para o estabelecimento.
 */
export async function getAvailableDaysInMonth(
  establishmentId: string,
  year: number,
  month: number
): Promise<number[]> {
  const availabilities = await prisma.availability.findMany({
    where: { establishmentId, active: true },
    select: { dayOfWeek: true },
  })

  const availableDays = new Set(availabilities.map((a: { dayOfWeek: number }) => a.dayOfWeek))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: number[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    if (date >= today && availableDays.has(date.getDay())) {
      days.push(day)
    }
  }

  return days
}
