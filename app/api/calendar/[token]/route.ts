import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateIcsEvent } from "@/lib/ics"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const booking = await prisma.booking.findUnique({
    where: { cancelToken: token },
    include: {
      establishment: true,
      service: true,
    },
  })

  if (!booking || booking.status !== "CONFIRMED") {
    return new NextResponse("Not found", { status: 404 })
  }

  const ics = generateIcsEvent({
    uid: booking.id,
    title: `${booking.service.name} — ${booking.establishment.name}`,
    description: `Estabelecimento: ${booking.establishment.name}\nServiço: ${booking.service.name}`,
    startTime: booking.startTime,
    endTime: booking.endTime,
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="agendamento.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
