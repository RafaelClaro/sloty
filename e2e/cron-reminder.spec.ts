/**
 * E2E — Cron de lembretes D-1
 */
import { test, expect } from "@playwright/test"
import { BASE_URL, CRON_SECRET } from "./helpers"

test.describe("Cron — lembretes D-1", () => {
  test("sem Authorization → 401", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cron/lembretes`)
    expect(res.status()).toBe(401)
  })

  test("com CRON_SECRET → 200 + { total, sent, failed }", async ({ request }) => {
    if (!CRON_SECRET) {
      test.skip()
      return
    }
    const res = await request.get(`${BASE_URL}/api/cron/lembretes`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.total).toBe("number")
    expect(typeof body.sent).toBe("number")
    expect(typeof body.failed).toBe("number")
    expect(body.failed).toBeLessThanOrEqual(body.total)
  })
})
