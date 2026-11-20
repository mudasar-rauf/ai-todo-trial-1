import { expect, test } from '@playwright/test';
import { APP_NAME } from '../src/appName';

const THEME_FONT = 'Figtree';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has one banner landmark with the app name, and one main landmark below it', async ({
  page,
}) => {
  const banner = page.getByRole('banner');
  const main = page.getByRole('main');

  await expect(banner).toHaveCount(1);
  await expect(main).toHaveCount(1);
  await expect(banner).toContainText(APP_NAME);

  const bannerBox = await banner.boundingBox();
  const mainBox = await main.boundingBox();
  expect(bannerBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  expect(mainBox!.y).toBeGreaterThanOrEqual(bannerBox!.y + bannerBox!.height);
});

test("shows none of Vite's demo content", async ({ page }) => {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByText('Vite + React')).toHaveCount(0);
  await expect(page.getByText(/count is/i)).toHaveCount(0);
  await expect(page.getByAltText(/logo/i)).toHaveCount(0);
});

test('takes its spacing from Astryx: no default body margin', async ({ page }) => {
  await expect(page.getByRole('banner')).toBeVisible();
  const margin = await page.evaluate(() => getComputedStyle(document.body).margin);
  expect(margin).toBe('0px');
});

test("draws the app name in the theme's font, loaded from the app", async ({ page }) => {
  const name = page.getByRole('banner').getByText(APP_NAME);
  await expect(name).toBeAttached();

  const fontFamily = await name.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.split(',')[0].trim().replace(/["']/g, '')).toBe(THEME_FONT);

  // fonts.check() is true when no face of the family exists at all, so assert that a
  // face of the theme's font was declared and actually loaded.
  const loadedFaces = await page.evaluate(async (family) => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((face) => face.family.replace(/["']/g, '') === family && face.status === 'loaded')
      .map((face) => face.weight);
  }, THEME_FONT);
  expect(loadedFaces.length).toBeGreaterThan(0);
});
