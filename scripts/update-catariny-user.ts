import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const hash = await bcrypt.hash("admin@123", 12)
  const est = await prisma.establishment.findUnique({ where: { slug: "catariny" } })
  if (!est) { console.error("catariny not found"); process.exit(1) }

  await prisma.user.update({
    where: { establishmentId: est.id },
    data: { email: "rafaelpclaroo@gmail.com", passwordHash: hash },
  })
  console.log("✅ Usuário da Catariny atualizado: rafaelpclaroo@gmail.com / admin@123")
}

main().catch(console.error).finally(() => prisma.$disconnect())
