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

  // Calcula o início/fim do dia de amanhã em horário de Brasília (UTC-3),
  // não em UTC — senão agendamentos entre 21h e 23h59 BRT caem na janela
  // do dia errado.
  const BRT_OFFSET_MS = 3 * 60 * 60 * 1000
  const nowBrt = new Date(Date.now() - BRT_OFFSET_MS)
  const tomorrowBrt = new Date(nowBrt)
  tomorrowBrt.setUTCDate(tomorrowBrt.getUTCDate() + 1)
  tomorrowBrt.setUTCHours(0, 0, 0, 0)
  const tomorrowStart = new Date(tomorrowBrt.getTime() + BRT_OFFSET_MS)
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000 - 1)

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
        primaryColor: booking.establishment.primaryColor ?? undefined,
      })
      sent++
    } catch (error) {
      console.error(`[cron/lembretes] falha ao enviar para booking ${booking.id}:`, error)
      failed++
    }
  }

  return NextResponse.json({ total: bookings.length, sent, failed })
}
