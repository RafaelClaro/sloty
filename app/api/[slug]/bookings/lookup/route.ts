import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 })
  }

  const establishment = await prisma.establishment.findUnique({
    where: { slug },
  })

  if (!establishment) {
    return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 })
  }

  const booking = await prisma.booking.findFirst({
    where: {
      cancelToken: token.toUpperCase(),
      establishmentId: establishment.id,
    },
    include: {
      service: {
        select: { name: true, durationMinutes: true, price: true },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    clientName: booking.clientName,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    cancelToken: booking.cancelToken,
    service: {
      name: booking.service.name,
      durationMinutes: booking.service.durationMinutes,
      price: booking.service.price.toString(),
    },
  })
}
