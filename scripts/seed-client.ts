import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface Args {
  slug: string
  name: string
  description?: string
  phone?: string
  notifyEmail?: string
  adminEmail: string
  adminPassword: string
}

function parseArgs(): Args {
  const raw: Record<string, string> = {}
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([a-zA-Z]+)=(.*)$/)
    if (match) raw[match[1]] = match[2]
  }

  const required = ["slug", "name", "adminEmail", "adminPassword"] as const
  const missing = required.filter((key) => !raw[key])
  if (missing.length > 0) {
    console.error(`❌ Faltam argumentos obrigatórios: ${missing.join(", ")}`)
    console.error(`
Uso:
  npx tsx scripts/seed-client.ts \\
    --slug="dra-fulana" \\
    --name="Dra. Fulana de Tal" \\
    --description="Dermatologia • Agende sua consulta" \\
    --phone="(11) 99999-9999" \\
    --notifyEmail="fulana@gmail.com" \\
    --adminEmail="admin@drafulana.com" \\
    --adminPassword="senha-segura-aqui"
`)
    process.exit(1)
  }

  return {
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    phone: raw.phone,
    notifyEmail: raw.notifyEmail,
    adminEmail: raw.adminEmail,
    adminPassword: raw.adminPassword,
  }
}

async function main() {
  const args = parseArgs()

  const existing = await prisma.establishment.findUnique({ where: { slug: args.slug } })
  if (existing) {
    console.error(`❌ Já existe um estabelecimento com o slug "${args.slug}".`)
    process.exit(1)
  }

  const existingUser = await prisma.user.findUnique({ where: { email: args.adminEmail } })
  if (existingUser) {
    console.error(`❌ Já existe um admin com o email "${args.adminEmail}".`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(args.adminPassword, 10)

  const establishment = await prisma.$transaction(async (tx) => {
    const est = await tx.establishment.create({
      data: {
        slug: args.slug,
        name: args.name,
        description: args.description,
        phone: args.phone,
        notifyEmail: args.notifyEmail,
        timezone: "America/Sao_Paulo",
      },
    })

    await tx.user.create({
      data: {
        establishmentId: est.id,
        email: args.adminEmail,
        passwordHash,
      },
    })

    // Padrão: segunda a sexta 09:00-18:00, sábado e domingo fechado
    await tx.availability.createMany({
      data: [
        { establishmentId: est.id, dayOfWeek: 0, startTime: "09:00", endTime: "18:00", active: false },
        { establishmentId: est.id, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", active: true },
        { establishmentId: est.id, dayOfWeek: 2, startTime: "09:00", endTime: "18:00", active: true },
        { establishmentId: est.id, dayOfWeek: 3, startTime: "09:00", endTime: "18:00", active: true },
        { establishmentId: est.id, dayOfWeek: 4, startTime: "09:00", endTime: "18:00", active: true },
        { establishmentId: est.id, dayOfWeek: 5, startTime: "09:00", endTime: "18:00", active: true },
        { establishmentId: est.id, dayOfWeek: 6, startTime: "09:00", endTime: "18:00", active: false },
      ],
    })

    return est
  })

  console.log("✅ Cliente onboarded com sucesso!\n")
  console.log(`   Estabelecimento: ${establishment.name}`)
  console.log(`   Link público:    /${establishment.slug}`)
  console.log(`   Admin login:     ${args.adminEmail}`)
  console.log(`   Admin senha:     ${args.adminPassword}`)
  console.log(`\n   Lembre de configurar os serviços pelo painel admin.`)
}

main()
  .catch((err) => {
    console.error("❌ Erro ao fazer onboarding:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
