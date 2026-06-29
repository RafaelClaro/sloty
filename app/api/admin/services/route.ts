import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const services = await prisma.service.findMany({
    where: { establishmentId: session.user.establishmentId, active: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ services })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const { name, durationMinutes, price, description } = body

  if (!name || !durationMinutes || price === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const service = await prisma.service.create({
    data: {
      establishmentId: session.user.establishmentId,
      name,
      durationMinutes: parseInt(durationMinutes),
      price,
      description,
    },
  })

  return NextResponse.json({ service }, { status: 201 })
}
