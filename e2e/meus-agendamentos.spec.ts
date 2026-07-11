/**
 * E2E — Meus agendamentos
 */
import { test, expect } from "@playwright/test"
import { SLUG, bookFirstAvailableSlot } from "./helpers"

test.describe("Meus agendamentos", () => {
  test("link na página inicial abre a tela correta", async ({ page }) => {
    await page.goto(`/${SLUG}`)
    await page.locator(`a[href='/${SLUG}/meus-agendamentos']`).click()
    await expect(page).toHaveURL(`**/${SLUG}/meus-agendamentos`)
    await expect(page.locator("text=Meus agendamentos")).toBeVisible()
  })

  test("token inválido exibe erro", async ({ page }) => {
    await page.goto(`/${SLUG}/meus-agendamentos`)
    await page.fill("input[placeholder*='NE5RW8KA']", "INVALIDO")
    await page.locator("button", { hasText: "Buscar agendamento" }).click()
    await expect(page.locator("text=/não encontrado/i")).toBeVisible({ timeout: 8_000 })
  })

  test("URL com ?token= pré-preenche e auto-busca", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    await page.goto(`/${SLUG}/meus-agendamentos?token=${token}`)
    await expect(page.locator("text=Seu agendamento")).toBeVisible({ timeout: 10_000 })
    await expect(page.locator("text=✓ Preenchido automaticamente pelo link do email")).toBeVisible()
    const inputVal = await page.locator("input[placeholder*='NE5RW8KA']").inputValue()
    expect(inputVal).toBe(token)
  })

  test("cancelar agendamento → 'Agendamento cancelado'", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    await page.goto(`/${SLUG}/meus-agendamentos?token=${token}`)
    await expect(page.locator("text=Seu agendamento")).toBeVisible({ timeout: 10_000 })
    await page.locator("button", { hasText: "Cancelar agendamento" }).click()
    await expect(page.locator("text=Confirmar cancelamento?")).toBeVisible()
    await page.locator("button", { hasText: "Sim, cancelar" }).click()
    await expect(page.locator("text=Agendamento cancelado")).toBeVisible({ timeout: 10_000 })
  })

  test("token já cancelado exibe erro", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    await page.request.post(`/api/${SLUG}/bookings/cancel`, {
      data: { cancelToken: token },
    })
    await page.goto(`/${SLUG}/meus-agendamentos`)
    await page.fill("input[placeholder*='NE5RW8KA']", token)
    await page.locator("button", { hasText: "Buscar agendamento" }).click()
    await expect(page.locator("text=/cancelado/i")).toBeVisible({ timeout: 8_000 })
  })

  test("reagendar → redirecionamento para novo horário", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    await page.goto(`/${SLUG}/meus-agendamentos?token=${token}`)
    await expect(page.locator("text=Seu agendamento")).toBeVisible({ timeout: 10_000 })
    await page.locator("button", { hasText: "Reagendar" }).click()
    await expect(page.locator("text=Horário cancelado")).toBeVisible({ timeout: 10_000 })
    await page.locator("button", { hasText: "Escolher novo horário" }).click()
    await expect(page).toHaveURL(`**/${SLUG}`)
  })

  test("busca manual de token funciona", async ({ page }) => {
    const token = await bookFirstAvailableSlot(page)
    await page.goto(`/${SLUG}/meus-agendamentos`)
    const inputVal = await page.locator("input[placeholder*='NE5RW8KA']").inputValue()
    expect(inputVal).toBe("")
    await page.fill("input[placeholder*='NE5RW8KA']", token)
    await page.locator("button", { hasText: "Buscar agendamento" }).click()
    await expect(page.locator("text=Seu agendamento")).toBeVisible({ timeout: 10_000 })
  })
})
