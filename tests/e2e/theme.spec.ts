import { expect, test } from '@playwright/test';

test('?theme=dark áp dụng giao diện tối ngay sau khi tải', async ({ page }) => {
  await page.goto('/?theme=dark');

  const theme = await page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme,
    colorScheme: document.documentElement.style.colorScheme,
  }));

  expect(theme.dataTheme).toBe('dark');
  expect(theme.colorScheme).toBe('dark');
  await expect(
    page.getByRole('button', { name: 'Chuyển sang giao diện sáng' })
  ).toBeVisible();
});

test('toggle lưu localStorage và reload không bị nháy sáng', async ({ page }) => {
  await page.goto('/?theme=light');

  await page.getByRole('button', { name: 'Chuyển sang giao diện tối' }).click();

  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  expect(
    await page.evaluate(() => document.documentElement.dataset.theme)
  ).toBe('dark');

  // Ghi lại data-theme đúng lúc DOMContentLoaded của lần tải kế tiếp.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { __themeAtDCL?: string }).__themeAtDCL =
        document.documentElement.dataset.theme;
    });
  });

  await page.goto('/');

  const atDomContentLoaded = await page.evaluate(
    () => (window as unknown as { __themeAtDCL?: string }).__themeAtDCL
  );
  expect(atDomContentLoaded).toBe('dark');
  expect(
    await page.evaluate(() => document.documentElement.dataset.theme)
  ).toBe('dark');
});
