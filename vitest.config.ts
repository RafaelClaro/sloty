import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    // globalSetup roda "prisma migrate deploy" uma única vez para toda a
    // suíte (não por arquivo), evitando disputa pelo advisory lock do
    // Postgres contra o banco serverless.
    globalSetup: ["__tests__/setup.ts"],
    globals: true,
    exclude: ["node_modules", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "lib/availability.ts",
        "lib/ics.ts",
        "app/api/**/*.ts",
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
