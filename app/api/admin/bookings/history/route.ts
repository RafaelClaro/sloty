import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")
  const excludeId = searchParams.get("excludeId")

  if (!phone) return NextResponse.json({ error: "phone obrigatório" }, { status: 400 })

  const bookings = await prisma.booking.findMany({
    where: {
      establishmentId: session.user.establishmentId,
      clientPhone: phone,
      status: "CONFIRMED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { startTime: "desc" },
    take: 5,
    select: {
      id: true,
      startTime: true,
      service: { select: { name: true } },
    },
  })

  return NextResponse.json({ bookings })
}
