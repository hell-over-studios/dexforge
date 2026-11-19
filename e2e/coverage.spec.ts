/**
 * T4.3 offensive coverage: the panel answers "which types can't the team hit
 * super effectively?" from the picked moves + the game's own chart. Covers the
 * empty states, gap list updates, per-member answers (desktop matrix vs mobile
 * cards), status-move exclusion, removal and ES↔EN copy.
 */
import { expect, test } from '@playwright/test';

async function openEmerald(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.locator('a[href*="juego/emerald"]').click();
  const input = page.locator('#picker-input');
  await expect(input).toBeVisible();
  return input;
}

test('coverage: gaps, answers and damage-only filtering', async ({ page }, testInfo) => {
  const desktop = testInfo.project.name.includes('desktop');
  const input = await openEmerald(page);

  // 1. Empty team state
  const section = page.getByRole('region', { name: 'Cobertura ofensiva del equipo' });
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('heading', { name: 'Cobertura ofensiva' })).toBeVisible();
  await expect(section.getByText('Añade Pokémon al equipo para ver la cobertura.')).toBeVisible();

  // 2. A team with no picked moves asks for moves
  await input.fill('treecko');
  await page.locator('#picker-list [role="option"]').first().click();
  const detail = page.locator('section[aria-label="Treecko"]');
  await page.getByRole('button', { name: 'Añadir al equipo' }).click();
  await section.scrollIntoViewIfNeeded();
  await expect(
    section.getByText('Elige movimientos en la ficha de cada Pokémon para medir la cobertura.'),
  ).toBeVisible();

  // 3. Absorb (Grass) covers Water/Ground/Rock and leaves Steel open
  await detail.getByRole('button', { name: 'Elegir movimientos' }).click();
  const search = detail.getByLabel('Buscar movimiento');
  await search.fill('absorb');
  await detail.getByRole('button', { name: /^Absorber/ }).click();

  const gaps = section.getByRole('group', {
    name: 'Tipos sin cobertura súper eficaz',
  });
  await expect(gaps).toBeVisible();
  await expect(gaps.getByText('Acero', { exact: true })).toBeVisible();
  await expect(gaps.getByText('Agua', { exact: true })).toHaveCount(0);
  await expect(gaps.getByText('Tierra', { exact: true })).toHaveCount(0);

  if (desktop) {
    await expect(page.locator('[aria-label="Treecko: Absorber contra Agua ×2"]')).toBeVisible();
    await expect(page.locator('[aria-label="Treecko: Absorber contra Acero ×½"]')).toBeVisible();
  } else {
    await expect(section.getByRole('heading', { name: 'Respuestas por miembro' })).toBeVisible();
    await expect(section.locator('[aria-label="súper eficaz contra Agua"]')).toBeVisible();
    await expect(section.locator('[aria-label="súper eficaz contra Tierra"]')).toBeVisible();
  }

  // 4. Status moves are excluded: Malicioso alone leaves the panel empty
  await detail.getByRole('button', { name: 'Quitar Absorber' }).click();
  await expect(
    section.getByText('Elige movimientos en la ficha de cada Pokémon para medir la cobertura.'),
  ).toBeVisible();
  await search.fill('leer');
  await detail.getByRole('button', { name: /^Malicioso/ }).click();
  await section.scrollIntoViewIfNeeded();
  await expect(
    section.getByText('Elige movimientos en la ficha de cada Pokémon para medir la cobertura.'),
  ).toBeVisible();
  await expect(gaps).toHaveCount(0);

  // 5. Picking a damaging move again brings the coverage back
  await search.fill('absorb');
  await detail.getByRole('button', { name: /^Absorber/ }).click();
  await expect(gaps).toBeVisible();

  // 6. ES↔EN copy (in-page language toggle)
  await page.evaluate(() => {
    document.documentElement.lang = 'en';
  });
  await expect(section.getByRole('heading', { name: 'Offensive coverage' })).toBeVisible();
  await expect(
    section.getByRole('group', { name: 'Types without super-effective coverage' }),
  ).toBeVisible();
  await expect(section.getByText('No super-effective hit')).toBeVisible();
});
