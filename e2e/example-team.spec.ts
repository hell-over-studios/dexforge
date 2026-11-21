/**
 * UX-12 (#88): an empty workbench offers an example team; the team can be
 * cleared in one click and brought back with "Deshacer".
 */
import { expect, test } from '@playwright/test';

test('load the example team, clear it and undo', async ({ page }) => {
  await page.goto('./juego/emerald');
  // the button is in the static HTML: retry the click until the island has hydrated
  await expect(async () => {
    await page.getByRole('button', { name: /Probar con un equipo de ejemplo/ }).click();
    await expect(page.getByText('6/6')).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(page.getByRole('button', { name: /Quitar a Swampert del equipo/ })).toBeVisible();

  await page.getByRole('button', { name: 'Vaciar todo el equipo' }).click();
  await expect(page.getByText('0/6')).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByText('6/6')).toBeVisible();
});
