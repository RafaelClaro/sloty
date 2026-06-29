import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const updated = await prisma.booking.updateMany({
    where: { id, establishmentId: session.user.establishmentId },
    data: { status: "CANCELLED" },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ message: "Agendamento cancelado" })
}
