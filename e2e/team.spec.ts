/**
 * First e2e smoke (T2.10): the core v0.2 loop end-to-end against the built
 * site — pick a game from the home page, search, add six Pokémon, share by
 * URL (?t=) and see the team restored in a brand-new visitor context and on
 * reload (localStorage). Speed is valued over breadth: this is the wake-up
 * smoke; deeper flows stay with the unit suite and manual verification.
 */
import { expect, test } from '@playwright/test';

// copy-link uses the async clipboard API → needs permissions
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const TEAM = ['treecko', 'torchic', 'mudkip', 'gardevoir', 'absol', 'wailord'];

test('pick game, add 6 via drawer, share by URL, restore everywhere', async ({ browser, page }) => {
  // 1. home -> select the Emerald card (relative './' keeps the /dexforge base)
  await page.goto('./');
  await page.locator('a[href*="juego/emerald"]').click();
  await expect(page).toHaveURL(/\/dexforge\/juego\/emerald/);
  const input = page.locator('#picker-input');
  await expect(input).toBeVisible();

  // 2. search and add six through the drawer team button
  for (const name of TEAM) {
    await input.fill(name);
    await page.locator('#picker-list [role="option"]').first().click();
    await page.getByRole('button', { name: 'Añadir al equipo' }).click();
  }
  await expect(page.locator('ul[role="list"] li')).toHaveCount(6);
  await expect(page.getByText('6/6')).toBeVisible();

  // 3. copy link -> clipboard holds the ?t= share stub
  await page.getByRole('button', { name: 'Copiar enlace para compartir el equipo' }).click();
  await expect(page.getByText('¡Enlace copiado!')).toBeVisible();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toMatch(/\/dexforge\/juego\/emerald\?t=v1\.emerald\.[a-z0-9.]+$/);

  // 4. a brand-new visitor (fresh context, empty localStorage) sees the team
  const visitor = await (await browser.newContext({ permissions: [] })).newPage();
  await visitor.goto(shared);
  await expect(visitor.locator('ul[role="list"] li')).toHaveCount(6);
  await expect(visitor.getByRole('button', { name: /Quitar a Treecko del equipo/ })).toBeVisible();
  await visitor.close();

  // 5. reload restores from localStorage
  await page.reload();
  await expect(page.locator('ul[role="list"] li')).toHaveCount(6);
  await expect(page.getByRole('button', { name: /Quitar a Treecko del equipo/ })).toBeVisible();
});
