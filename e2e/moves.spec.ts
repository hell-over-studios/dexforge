/**
 * T4.2 move picker: four slots inside the drawer, version-group-accurate
 * learnset search + type filter, replace-oldest, removal, keyboard toggling,
 * ES/EN copy and the v2 share round-trip. Runs in both configured projects
 * (desktop + mobile-ish) and checks the drawer never overflows horizontally.
 */
import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function openEmerald(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.locator('a[href*="juego/emerald"]').click();
  const input = page.locator('#picker-input');
  await expect(input).toBeVisible();
  return input;
}

test('pick 4 moves, filter, replace, remove, share v2 and restore', async ({ browser, page }) => {
  const input = await openEmerald(page);

  // 1. Not in the team yet: the picker is gated behind a one-line hint
  await input.fill('treecko');
  await page.locator('#picker-list [role="option"]').first().click();
  const detail = page.locator('section[aria-label="Treecko"]');
  await expect(detail).toBeVisible();
  await expect(
    detail.getByText('Añade a Treecko al equipo para elegir hasta 4 movimientos'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Añadir al equipo' }).click();
  await expect(detail.getByText('0/4')).toBeVisible();

  // 2. Open the learnset list and add the first move
  await detail.getByRole('button', { name: 'Elegir movimientos' }).click();
  const panel = detail.getByRole('region', { name: 'Lista de movimientos' });
  await expect(panel).toBeVisible();
  const search = detail.getByLabel('Buscar movimiento');
  await search.fill('absorb');
  await panel.getByRole('button', { name: /^Absorber/ }).click();
  await expect(detail.getByText('Añadido: Absorber.')).toBeVisible();
  await expect(detail.getByText('1/4')).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Quitar Absorber' })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Absorber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // 3. Type filter is version-group accurate and combinable with the search
  await search.fill('');
  await panel.getByRole('button', { name: 'Planta', exact: true }).click();
  await expect(panel.getByRole('button', { name: /^Absorber/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Destructor/ })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Todos', exact: true }).click();

  // 4. Fill the four slots
  for (const [slug, name] of [
    ['mega-drain', 'Megaagotar'],
    ['giga-drain', 'Gigadrenado'],
    ['quick-attack', 'Ataque Rápido'],
  ]) {
    await search.fill(slug);
    await panel.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  }
  await expect(detail.getByText('4/4')).toBeVisible();

  // 5. A fifth move replaces the oldest; keyboard Enter toggles too
  await search.fill('pursuit');
  const pursuit = panel.getByRole('button', { name: /^Persecución/ });
  await pursuit.focus();
  await page.keyboard.press('Enter');
  await expect(detail.getByText('Salió Absorber.')).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Quitar Absorber' })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Quitar Persecución' })).toBeVisible();
  await expect(detail.getByText('4/4')).toBeVisible();

  // 6. Slot removal
  await detail.getByRole('button', { name: 'Quitar Persecución' }).click();
  await expect(detail.getByText('Quitado: Persecución.')).toBeVisible();
  await expect(detail.getByText('3/4')).toBeVisible();

  // 7. no horizontal overflow with the picker open (360px-class widths)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // 8. Copy link now emits a v2 payload (team + move slots)
  await page.getByRole('button', { name: 'Copiar enlace para compartir el equipo' }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  const shareUrl = new URL(shared);
  expect(shareUrl.pathname).toMatch(/\/dexforge\/juego\/emerald$/);
  const shareValue = shareUrl.searchParams.get('t') ?? '';
  expect(shareValue).toMatch(/^v2\.emerald\.[a-z0-9]+:[a-z0-9,]+$/);

  // 9. A fresh visitor restores the team and its moves
  const visitor = await (await browser.newContext({ permissions: [] })).newPage();
  await visitor.goto(shared);
  const visitorInput = visitor.locator('#picker-input');
  await expect(visitorInput).toBeVisible();
  await visitorInput.fill('treecko');
  await visitor.locator('#picker-list [role="option"]').first().click();
  const visitorDetail = visitor.locator('section[aria-label="Treecko"]');
  await expect(visitorDetail.getByText('3/4')).toBeVisible();
  await expect(visitorDetail.getByRole('button', { name: 'Quitar Megaagotar' })).toBeVisible();
  await expect(visitorDetail.getByRole('button', { name: 'Quitar Gigadrenado' })).toBeVisible();
  await expect(visitorDetail.getByRole('button', { name: 'Quitar Ataque Rápido' })).toBeVisible();
  await expect(visitorDetail.getByRole('button', { name: 'Quitar Absorber' })).toHaveCount(0);
  await visitor.close();

  // 10. ES/EN copy follows the in-page language toggle
  await page.evaluate(() => {
    document.documentElement.lang = 'en';
  });
  await expect(detail.getByText('Moves', { exact: true })).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Hide move list' })).toBeVisible();
  await expect(detail.getByLabel('Search moves')).toBeVisible();
});
