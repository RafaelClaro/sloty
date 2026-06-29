import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAvailableSlots, getAvailableDaysInMonth } from "@/lib/availability"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get("serviceId")
  const dateParam = searchParams.get("date")
  const monthParam = searchParams.get("month")
  const yearParam = searchParams.get("year")

  const establishment = await prisma.establishment.findUnique({
    where: { slug },
  })

  if (!establishment) {
    return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 })
  }

  if (monthParam && yearParam) {
    const days = await getAvailableDaysInMonth(
      establishment.id,
      parseInt(yearParam),
      parseInt(monthParam)
    )
    return NextResponse.json({ days })
  }

  if (!serviceId || !dateParam) {
    return NextResponse.json({ error: "serviceId e date são obrigatórios" }, { status: 400 })
  }

  // Parse as local noon to avoid UTC-to-local timezone shift changing the date
  const date = new Date(dateParam + "T12:00:00")
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }

  const slots = await getAvailableSlots(establishment.id, serviceId, date)
  return NextResponse.json({ slots })
}
