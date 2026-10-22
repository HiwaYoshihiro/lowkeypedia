import { expect, test } from '@playwright/test';

test('mở trang chi tiết tuyển thủ từ danh sách', async ({ page }) => {
  await page.goto('/tuyen-thu');

  await page.locator('.card-grid a.card').first().click();

  await expect(page).toHaveURL(/\/tuyen-thu\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.infobox')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thành tích thi đấu' })).toBeVisible();
  await expect(page.getByRole('table').first()).toBeVisible();
});

test('trang đội tuyển có infobox và đội hình liên kết tuyển thủ', async ({ page }) => {
  await page.goto('/doi-tuyen');

  await page.locator('.card-grid a.card', { hasText: 'Saigon Phantom' }).click();

  await expect(page).toHaveURL(/\/doi-tuyen\/saigon-phantom$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Saigon Phantom');
  await expect(page.locator('.infobox')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đội hình hiện tại' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fish' })).toHaveAttribute(
    'href',
    '/tuyen-thu/fish'
  );
});

test('trang giải đấu có lịch sử vô địch', async ({ page }) => {
  await page.goto('/giai-dau');

  await page
    .locator('.card-grid a.card', { hasText: 'Arena of Valor International Championship' })
    .click();

  await expect(page).toHaveURL(/\/giai-dau\/aic$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Arena of Valor International Championship'
  );
  await expect(page.getByRole('heading', { name: 'Lịch sử vô địch' })).toBeVisible();
  await expect(page.locator('table', { hasText: 'Full Sense' })).toBeVisible();
});
