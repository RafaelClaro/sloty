import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const service = await prisma.service.updateMany({
    where: { id, establishmentId: session.user.establishmentId },
    data: body,
  })

  if (service.count === 0) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ message: "Serviço atualizado" })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.service.updateMany({
    where: { id, establishmentId: session.user.establishmentId },
    data: { active: false },
  })

  return NextResponse.json({ message: "Serviço removido" })
}
