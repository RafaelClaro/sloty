import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["__tests__/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        functions: 80,
        lines: 80,
      },
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
