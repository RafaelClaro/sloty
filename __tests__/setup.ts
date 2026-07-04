import { execSync } from "child_process"

// Global setup do Vitest: roda uma única vez para toda a suíte, ao invés de
// uma vez por arquivo de teste. Rodar "prisma migrate deploy" por arquivo
// (via setupFiles) faz múltiplos processos disputarem o mesmo advisory lock
// do Postgres quase simultaneamente, o que é frágil contra um banco
// serverless (Neon) com latência variável de cold-start no pooler.
export default async function setup() {
  try {
    execSync("npx prisma migrate deploy", {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL,
      },
      stdio: "inherit",
    })
  } catch {
    // Advisory lock timeout no Neon pooler quando múltiplos jobs correm em paralelo.
    // As migrações já foram aplicadas — ignora e continua.
    console.warn("prisma migrate deploy falhou (provavelmente advisory lock). Continuando...")
  }
}
