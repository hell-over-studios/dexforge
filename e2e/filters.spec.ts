/**
 * UX-06 / UX-08: index filters. "Lo que más duele" asks the index for the
 * Pokémon that resist that type; type and role chips narrow the list.
 */
import { expect, test } from '@playwright/test';

test('filter the index by type and by what resists the team’s worst hit', async ({ page }) => {
  await page.goto('./juego/emerald');
  const input = page.locator('#picker-input');
  await expect(input).toBeVisible();

  // type filter: only Water types remain
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await page.locator('#picker-filters').getByRole('button', { name: 'Agua' }).click();
  await expect(page.locator('#picker-list [role="option"]').first()).toContainText('Mudkip');
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();

  // a team with Torchic: Water hurts it -> "Buscar quién resiste a Agua"
  await input.fill('torchic');
  await page.locator('#picker-list [role="option"]').first().click();
  await page.getByRole('button', { name: 'Añadir al equipo' }).click();
  // the defense panel hydrates when it scrolls into view (client:visible)
  await page
    .getByRole('region', { name: 'Análisis defensivo del equipo' })
    .scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Buscar quién resiste a Agua →' }).click();
  await expect(page.getByRole('button', { name: 'Quitar filtro: resiste a Agua' })).toBeVisible();
  // Hoenn #1 Treecko (Grass) resists Water; Torchic (Fire) must be gone
  await expect(page.locator('#picker-list [role="option"]').first()).toContainText('Treecko');
  await expect(page.locator('#picker-list')).not.toContainText('Torchic');
});
