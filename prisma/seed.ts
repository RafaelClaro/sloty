import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  const establishment = await prisma.establishment.upsert({
    where: { slug: "dra-ana-paula" },
    update: {},
    create: {
      slug: "dra-ana-paula",
      name: "Dra. Ana Paula",
      description: "Nutrologia • Agende sua consulta",
      phone: "(11) 99999-9999",
      timezone: "America/Sao_Paulo",
    },
  })

  await prisma.service.createMany({
    data: [
      { establishmentId: establishment.id, name: "Consulta Inicial", durationMinutes: 60, price: 300, description: "Avaliação nutricional completa" },
      { establishmentId: establishment.id, name: "Retorno", durationMinutes: 30, price: 180 },
      { establishmentId: establishment.id, name: "Consulta Online", durationMinutes: 45, price: 250 },
    ],
  })

  // All 7 days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  await prisma.availability.createMany({
    data: [
      { establishmentId: establishment.id, dayOfWeek: 0, startTime: "09:00", endTime: "18:00", active: false },
      { establishmentId: establishment.id, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", active: true },
      { establishmentId: establishment.id, dayOfWeek: 2, startTime: "09:00", endTime: "18:00", active: true },
      { establishmentId: establishment.id, dayOfWeek: 3, startTime: "09:00", endTime: "18:00", active: true },
      { establishmentId: establishment.id, dayOfWeek: 4, startTime: "09:00", endTime: "18:00", active: true },
      { establishmentId: establishment.id, dayOfWeek: 5, startTime: "09:00", endTime: "17:00", active: true },
      { establishmentId: establishment.id, dayOfWeek: 6, startTime: "09:00", endTime: "12:00", active: true },
    ],
  })

  const passwordHash = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email: "admin@draanapaula.com" },
    update: {},
    create: {
      establishmentId: establishment.id,
      email: "admin@draanapaula.com",
      passwordHash,
    },
  })

  console.log("✅ Seed concluído!")
  console.log("   Estabelecimento: /dra-ana-paula")
  console.log("   Admin: admin@draanapaula.com / admin123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
