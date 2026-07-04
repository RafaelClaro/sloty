import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const bookingId = new URL(request.url).searchParams.get("bookingId")
  if (!bookingId) return NextResponse.json({ error: "bookingId obrigatório" }, { status: 400 })

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, establishmentId: session.user.establishmentId },
    select: { notes: true },
  })

  if (!booking) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  return NextResponse.json({ notes: booking.notes ?? "" })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { bookingId, notes } = await request.json()
  if (!bookingId) return NextResponse.json({ error: "bookingId obrigatório" }, { status: 400 })

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, establishmentId: session.user.establishmentId },
    select: { id: true },
  })

  if (!booking) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  await prisma.booking.update({
    where: { id: bookingId },
    data: { notes: notes ?? "" },
  })

  return NextResponse.json({ ok: true })
}
