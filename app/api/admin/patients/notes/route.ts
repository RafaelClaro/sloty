import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const phone = new URL(request.url).searchParams.get("phone")
  if (!phone) return NextResponse.json({ error: "phone obrigatório" }, { status: 400 })

  const note = await prisma.patientNote.findUnique({
    where: { establishmentId_clientPhone: { establishmentId: session.user.establishmentId, clientPhone: phone } },
  })

  return NextResponse.json({ notes: note?.notes ?? "" })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { phone, notes } = await request.json()
  if (!phone) return NextResponse.json({ error: "phone obrigatório" }, { status: 400 })

  await prisma.patientNote.upsert({
    where: { establishmentId_clientPhone: { establishmentId: session.user.establishmentId, clientPhone: phone } },
    create: { establishmentId: session.user.establishmentId, clientPhone: phone, notes: notes ?? "" },
    update: { notes: notes ?? "" },
  })

  return NextResponse.json({ ok: true })
}
