import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const { cancelToken } = body

  if (!cancelToken) {
    return NextResponse.json({ error: "Token de cancelamento obrigatório" }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { cancelToken },
    include: { establishment: true, service: true },
  })

  if (!booking || booking.establishment.slug !== slug) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "Agendamento já foi cancelado" }, { status: 400 })
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  })

  return NextResponse.json({ message: "Agendamento cancelado com sucesso" })
}
