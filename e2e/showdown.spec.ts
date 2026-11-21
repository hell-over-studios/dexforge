/**
 * V1-01 (#94): import a Showdown paste into Emerald, see what did not fit,
 * and read the export back.
 */
import { expect, test } from '@playwright/test';

test('import and export a team in Showdown format', async ({ page }) => {
  await page.goto('./juego/emerald');
  // the toggle is in the static HTML: retry until the island has hydrated
  await expect(async () => {
    await page.getByRole('button', { name: /^Showdown/ }).click();
    await expect(page.getByLabel('Importar desde Showdown')).toBeVisible({ timeout: 1000 });
  }).toPass();

  await page
    .getByLabel('Importar desde Showdown')
    .fill('Mudkip @ Leftovers\n- Water Gun\n- Fly\n\nMewtwo\n- Psychic');
  await page.getByRole('button', { name: 'Importar a Esmeralda' }).click();

  await expect(page.getByText('1/6')).toBeVisible();
  await expect(page.getByText('Mudkip no puede aprender Fly en Esmeralda.')).toBeVisible();
  await expect(page.getByText('Mewtwo no está en Esmeralda.')).toBeVisible();
  await expect(page.getByLabel('Exportar para Showdown')).toHaveValue('Mudkip\n- Water Gun');
});
