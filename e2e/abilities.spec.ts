/**
 * T4.4 abilities view: the drawer lists abilities as in-place expanders with
 * the ES/EN effect, hidden/not-in-game markers and the team members that share
 * them. Runs in both configured projects (desktop + mobile-ish) and checks the
 * drawer never overflows horizontally.
 */
import { expect, test } from '@playwright/test';

async function openEmerald(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.locator('a[href*="juego/emerald"]').click();
  const input = page.locator('#picker-input');
  await expect(input).toBeVisible();
  return input;
}

test('abilities expand in place, flag later gens and list team peers', async ({ page }) => {
  const input = await openEmerald(page);

  // 1. Wingull joins the team first, so Pelipper can share Keen Eye with it
  await input.fill('wingull');
  await page.locator('#picker-list [role="option"]').first().click();
  await page.getByRole('button', { name: 'Añadir al equipo' }).click();

  // 2. Pelipper: Keen Eye is shared with the team; Drizzle exists in Gen III
  await input.fill('pelipper');
  await page.locator('#picker-list [role="option"]').first().click();
  const detail = page.locator('section[aria-label="Pelipper"]');
  await expect(detail).toBeVisible();

  const keenEye = detail.getByRole('button', { name: /Vista Lince/ });
  await expect(keenEye).toContainText('equipo');
  await expect(keenEye).toHaveAttribute('aria-expanded', 'false');
  await keenEye.click();
  await expect(keenEye).toHaveAttribute('aria-expanded', 'true');
  const keenPanel = detail.getByRole('region', { name: /Vista Lince/ });
  await expect(keenPanel).toContainText('También en tu equipo: Wingull');
  await expect(keenPanel).toContainText('Su aguda vista evita');
  // console.log('keen eye panel:', await keenPanel.textContent());

  // 3. Drizzle (Gen III) carries no "not in this game" marker
  const drizzle = detail.getByRole('button', { name: /Llovizna/ });
  await expect(drizzle).not.toContainText('no en este juego');
  await drizzle.click();
  await expect(detail.getByRole('region', { name: /Llovizna/ })).toContainText(
    'Hace que llueva al entrar en combate',
  );
  // only one ability stays open at a time
  await expect(keenEye).toHaveAttribute('aria-expanded', 'false');

  // 4. no horizontal overflow with the drawer open (360px-class widths)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // 5. Wingull's Hydration (Gen IV) is explicitly marked as not in the game
  await input.fill('wingull');
  await page.locator('#picker-list [role="option"]').first().click();
  const wingullDetail = page.locator('section[aria-label="Wingull"]');
  const hydration = wingullDetail.getByRole('button', { name: /Hidratación/ });
  await expect(hydration).toContainText('no en este juego');
  await hydration.click();
  await expect(wingullDetail.getByRole('region', { name: /Hidratación/ })).toContainText(
    'Esta habilidad no existía en este juego',
  );

  // 6. English copy follows the in-page language toggle
  await page.evaluate(() => {
    document.documentElement.lang = 'en';
  });
  await expect(wingullDetail.getByRole('button', { name: /not in this game/ })).toBeVisible();
  await expect(wingullDetail.getByRole('region', { name: /Hydration/ })).toContainText(
    'This ability did not exist in this game',
  );
});
