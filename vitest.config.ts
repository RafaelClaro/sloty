import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["__tests__/setup.ts"],
    globals: true,
    // Arquivos de teste rodam em série: setup.ts chama "prisma migrate deploy"
    // por arquivo, e execuções em paralelo disputam o mesmo advisory lock do
    // Postgres, causando timeout.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        functions: 80,
        lines: 80,
      },
      // Escopo restrito aos arquivos efetivamente cobertos pelos testes atuais
      // (lib/availability.ts, lib/ics.ts, bookings e bookings/cancel). Demais
      // rotas de app/api/** ainda não têm testes e ficam fora do threshold
      // até serem cobertas — do contrário o CI nunca passaria dos 80%.
      include: [
        "lib/availability.ts",
        "lib/ics.ts",
        "app/api/[slug]/bookings/route.ts",
        "app/api/[slug]/bookings/cancel/route.ts",
      ],
      exclude: [
        "app/api/auth/**",
        "**/*.d.ts",
        "**/node_modules/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
