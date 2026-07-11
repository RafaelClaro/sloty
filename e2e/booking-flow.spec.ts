/**
 * E2E — Fluxo completo de agendamento
 */
import { test, expect } from "@playwright/test"
import { SLUG, TEST_CLIENT, bookFirstAvailableSlot } from "./helpers"

test.describe("Fluxo de agendamento", () => {
  test("página inicial lista serviços e link Meus agendamentos", async ({ page }) => {
    await page.goto(`/${SLUG}`)
    await expect(page.locator("a[href*='/agendar']").first()).toBeVisible()
    await expect(page.locator(`a[href='/${SLUG}/meus-agendamentos']`)).toBeVisible()
  })

  test("fluxo completo → sucesso com cancelToken válido", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    expect(token).toMatch(/^[A-Z0-9]{8}$/)
    await expect(page.locator("a[href*='calendar.google.com']")).toBeVisible()
    await expect(page.locator("a[href*='/ics']")).toBeVisible()
  })

  test("validação de campos obrigatórios", async ({ page }) => {
    await page.goto(`/${SLUG}`)
    await page.locator("a[href*='/agendar']").first().click()
    await expect(page.locator(".bg-primary.text-white.font-bold")).toBeVisible({ timeout: 10_000 })
    const firstSlot = page.locator("button:not([disabled])").filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    await firstSlot.click()
    await page.locator("button", { hasText: "Próximo" }).click()
    await page.locator("button", { hasText: "Agendar agora" }).click()
    await expect(page.locator("text=Informe seu nome completo")).toBeVisible()
    await expect(page.locator("text=Informe um telefone válido")).toBeVisible()
  })

  test("email inválido exibe erro", async ({ page }) => {
    await page.goto(`/${SLUG}`)
    await page.locator("a[href*='/agendar']").first().click()
    await expect(page.locator(".bg-primary.text-white.font-bold")).toBeVisible({ timeout: 10_000 })
    const firstSlot = page.locator("button:not([disabled])").filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    await firstSlot.click()
    await page.locator("button", { hasText: "Próximo" }).click()
    await page.fill("input[placeholder='Maria da Silva']", TEST_CLIENT.name)
    await page.fill("input[type='tel']", TEST_CLIENT.phone)
    await page.fill("input[type='email']", "email-invalido")
    await page.locator("button", { hasText: "Agendar agora" }).click()
    await expect(page.locator("text=Informe um email válido")).toBeVisible()
  })

  test("conflito de slot → 409 via API", async ({ page }) => {
    // Faz o primeiro agendamento e captura data/hora
    await page.goto(`/${SLUG}`)
    await page.locator("a[href*='/agendar']").first().click()
    await expect(page.locator(".bg-primary.text-white.font-bold")).toBeVisible({ timeout: 10_000 })
    const firstSlot = page.locator("button:not([disabled])").filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    const slotTime = await firstSlot.textContent()
    await firstSlot.click()
    await page.locator("button", { hasText: "Próximo" }).click()

    const url = new URL(page.url())
    const date = url.searchParams.get("date") ?? ""
    const serviceId = url.searchParams.get("serviceId") ?? ""

    await page.fill("input[placeholder='Maria da Silva']", "Primeiro Paciente")
    await page.fill("input[type='tel']", "(11) 91111-1111")
    await page.locator("button", { hasText: "Agendar agora" }).click()
    await page.waitForURL(`**/${SLUG}/sucesso**`, { timeout: 15_000 })

    // Tenta o mesmo horário via API diretamente
    const startTime = new Date(`${date}T${slotTime}:00`).toISOString()
    const res = await page.request.post(`/api/${SLUG}/bookings`, {
      data: { serviceId, startTime, clientName: "Segundo Paciente", clientPhone: "(11) 92222-2222" },
    })
    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/horário/i)
  })
})
