import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const date = new Date(dateParam)

  const bookings = await prisma.booking.findMany({
    where: {
      establishmentId: session.user.establishmentId,
      status: "CONFIRMED",
      startTime: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
      },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  })

  return NextResponse.json({ bookings })
}
