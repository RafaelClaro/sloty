import { Page, expect } from "@playwright/test"

export const SLUG = process.env.E2E_SLUG ?? "catariny"
export const BASE_URL = process.env.E2E_BASE_URL ?? "https://catariny.agendaweb.digital"
export const CRON_SECRET = process.env.CRON_SECRET ?? ""

export const TEST_CLIENT = {
  name: "Teste E2E Playwright",
  phone: "(11) 99999-0001",
  email: "e2e-test@example.com",
}

/**
 * Completa o fluxo de agendamento do início ao fim.
 * Retorna o cancelToken exibido na tela de sucesso.
 */
export async function bookFirstAvailableSlot(page: Page): Promise<string> {
  await page.goto(`/${SLUG}`)

  // Escolhe o primeiro serviço disponível
  const firstService = page.locator("a[href*='/agendar']").first()
  await expect(firstService).toBeVisible()
  await firstService.click()

  // Aguarda o calendário carregar (dia selecionado em destaque)
  await expect(page.locator(".bg-primary.text-white.font-bold")).toBeVisible({ timeout: 10_000 })

  // Aguarda horários carregarem e clica no primeiro disponível
  const firstSlot = page.locator("button:not([disabled])").filter({ hasText: /^\d{2}:\d{2}$/ }).first()
  await expect(firstSlot).toBeVisible({ timeout: 10_000 })
  await firstSlot.click()

  // Próximo
  await page.locator("button", { hasText: "Próximo" }).click()

  // Preenche o formulário
  await page.fill("input[placeholder='Maria da Silva']", TEST_CLIENT.name)
  await page.fill("input[type='tel']", TEST_CLIENT.phone)
  await page.fill("input[type='email']", TEST_CLIENT.email)

  // Submete
  await page.locator("button", { hasText: "Agendar agora" }).click()
  await page.waitForURL(`**/${SLUG}/sucesso**`, { timeout: 15_000 })

  // Extrai o cancelToken
  const tokenEl = page.locator("p.text-2xl.font-bold.text-neutral-900.tracking-\\[0\\.2em\\]")
  await expect(tokenEl).toBeVisible()
  return (await tokenEl.textContent()) ?? ""
}
