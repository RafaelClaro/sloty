import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const establishment = await prisma.establishment.findUnique({
    where: { id: session.user.establishmentId },
    select: { name: true, notifyEmail: true, phone: true, slug: true, primaryColor: true, primaryDark: true, primaryLight: true, fontFamily: true },
  })

  return NextResponse.json({ establishment })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const { notifyEmail, primaryColor, primaryDark, primaryLight, fontFamily } = body

  await prisma.establishment.update({
    where: { id: session.user.establishmentId },
    data: {
      ...(notifyEmail !== undefined && { notifyEmail }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(primaryDark !== undefined && { primaryDark }),
      ...(primaryLight !== undefined && { primaryLight }),
      ...(fontFamily !== undefined && { fontFamily }),
    },
  })

  return NextResponse.json({ message: "Configurações atualizadas" })
}
