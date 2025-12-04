import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Web teleprompter', () => {
  test('responds to keyboard controls for playback and navigation', async ({ page }) => {
    await page.goto('/')

    const body = page.locator('body')
    const speedValue = page.locator('dt:has-text("Scroll speed") + dd')
    const activeSegment = page.locator('dt:has-text("Active segment") + dd')

    await expect(speedValue).toHaveText('1.00x')
    await expect(activeSegment).toContainText('Opening Hook')

    await body.press('Space')
    await expect(page.getByRole('button', { name: /pause scroll/i })).toBeVisible()

    await body.press('ArrowUp')
    await expect(speedValue).toHaveText('1.10x')

    await body.press('j')
    await expect(activeSegment).not.toContainText('Opening Hook')

    await body.press('Space')
    await expect(page.getByRole('button', { name: /start scroll/i })).toBeVisible()
  })

  test('passes axe-core accessibility checks on the main view', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page }).include('main').analyze()

    expect(results.violations).toEqual([])
  })
})
