import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const rules = await prisma.availability.findMany({
    where: { establishmentId: session.user.establishmentId },
    orderBy: { dayOfWeek: "asc" },
  })

  return NextResponse.json({ rules })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const { rules } = body

  await prisma.$transaction(async (tx) => {
    await tx.availability.deleteMany({
      where: { establishmentId: session.user.establishmentId },
    })
    await tx.availability.createMany({
      data: rules.map((r: { dayOfWeek: number; startTime: string; endTime: string; active: boolean }) => ({
        establishmentId: session.user.establishmentId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        active: r.active,
      })),
    })
  })

  return NextResponse.json({ message: "Horários atualizados" })
}
