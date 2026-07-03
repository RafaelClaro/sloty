import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendBookingReminder } from "@/lib/reminder"

/**
 * Dispara lembretes D-1 para todos os agendamentos confirmados do dia seguinte.
 * Agendado via vercel.json (crons) às 21h UTC = 18h em Brasília.
 * Protegido por CRON_SECRET para evitar disparo por terceiros.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const now = new Date()
  const tomorrowStart = new Date(now)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  tomorrowStart.setUTCHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setUTCHours(23, 59, 59, 999)

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      clientEmail: { not: null },
      startTime: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: { establishment: true, service: true },
  })

  let sent = 0
  let failed = 0

  for (const booking of bookings) {
    if (!booking.clientEmail) continue
    try {
      await sendBookingReminder({
        toEmail: booking.clientEmail,
        establishmentName: booking.establishment.name,
        establishmentSlug: booking.establishment.slug,
        clientName: booking.clientName,
        serviceName: booking.service.name,
        startTime: booking.startTime,
        cancelToken: booking.cancelToken,
      })
      sent++
    } catch (error) {
      console.error(`[cron/lembretes] falha ao enviar para booking ${booking.id}:`, error)
      failed++
    }
  }

  return NextResponse.json({ total: bookings.length, sent, failed })
}
