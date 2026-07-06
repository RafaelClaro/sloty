import { prisma } from "@/lib/prisma"

async function main() {
  const est = await prisma.establishment.findUnique({ where: { slug: "suaagenda" } })
  if (!est) { console.error("estabelecimento suaagenda não encontrado"); process.exit(1) }

  await prisma.service.createMany({
    data: [
      { establishmentId: est.id, name: "Atendimento", durationMinutes: 60, price: 0, active: true },
      { establishmentId: est.id, name: "Retorno", durationMinutes: 30, price: 0, active: true },
      { establishmentId: est.id, name: "Atendimento online", durationMinutes: 45, price: 0, active: true },
    ],
  })

  console.log("✅ 3 serviços criados para suaagenda")
}

main().catch(console.error).finally(() => prisma.$disconnect())
