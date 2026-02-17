import { test, expect } from "@playwright/test"

test.describe("Auth flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /Connexion/i })).toBeVisible()
  })

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder(/admin@estsb/i).fill("wrong@test.local")
    await page.getByPlaceholder(/••••/).fill("wrong")
    await page.getByRole("button", { name: /Se connecter/i }).click()
    await expect(page.getByText(/Invalid|invalide|Identifiants/i)).toBeVisible({ timeout: 5000 })
  })
})
