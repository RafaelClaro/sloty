import { execSync } from "child_process"
import { beforeAll } from "vitest"

// Roda migrations no banco de teste antes de todos os testes
beforeAll(async () => {
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL,
    },
    stdio: "inherit",
  })
})
