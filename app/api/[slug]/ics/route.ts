import { NextRequest, NextResponse } from "next/server"
import { generateIcsEvent } from "@/lib/ics"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const service = searchParams.get("service")
  const date = searchParams.get("date")
  const time = searchParams.get("time")

  if (!token || !service || !date || !time) {
    return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 })
  }

  const startTime = new Date(`${date}T${time}:00`)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

  const ics = generateIcsEvent({
    uid: token,
    title: decodeURIComponent(service),
    description: `Agendamento em ${slug}`,
    startTime,
    endTime,
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="agendamento.ics"',
    },
  })
}
