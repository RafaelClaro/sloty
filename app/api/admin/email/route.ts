import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { newEmail, currentPassword } = await request.json()

  if (!newEmail || !currentPassword) {
    return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Informe um email válido" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { establishmentId: session.user.establishmentId } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: "Senha incorreta" }, { status: 400 })

  const taken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (taken && taken.id !== user.id) {
    return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
  }

  await prisma.user.update({ where: { id: user.id }, data: { email: newEmail } })

  return NextResponse.json({ message: "Email atualizado com sucesso" })
}
