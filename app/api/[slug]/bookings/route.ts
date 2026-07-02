import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { notifyEstablishmentNewBooking } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const { serviceId, startTime, clientName, clientPhone, clientEmail } = body

  if (!serviceId || !startTime || !clientName || !clientPhone || !clientEmail) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
  }

  const establishment = await prisma.establishment.findUnique({
    where: { slug },
  })

  if (!establishment) {
    return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 })
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, establishmentId: establishment.id, active: true },
  })

  if (!service) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
  }

  const start = new Date(startTime)
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booking = await prisma.$transaction(async (tx: any) => {
      const conflict = await tx.booking.findFirst({
        where: {
          establishmentId: establishment.id,
          status: "CONFIRMED",
          startTime: { lt: end },
          endTime: { gt: start },
        },
      })

      if (conflict) throw new Error("SLOT_CONFLICT")

      return tx.booking.create({
        data: {
          establishmentId: establishment.id,
          serviceId,
          clientName,
          clientPhone,
          clientEmail,
          startTime: start,
          endTime: end,
          cancelToken: nanoid(8).toUpperCase(),
          status: "CONFIRMED",
        },
        include: { service: true },
      })
    })

    // Email em background — nunca derruba o agendamento
    if (establishment.notifyEmail) {
      notifyEstablishmentNewBooking({
        toEmail: establishment.notifyEmail,
        establishmentName: establishment.name,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        serviceName: booking.service.name,
        servicePrice: Number(booking.service.price),
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.id,
      }).catch((err) => console.error("[email notify]", err))
    }

    return NextResponse.json({
      id: booking.id,
      cancelToken: booking.cancelToken,
      startTime: booking.startTime,
      endTime: booking.endTime,
      serviceName: booking.service.name,
    }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SLOT_CONFLICT") {
      return NextResponse.json(
        { error: "Esse horário acabou de ser ocupado. Escolha outro." },
        { status: 409 }
      )
    }
    console.error("[POST /bookings]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
