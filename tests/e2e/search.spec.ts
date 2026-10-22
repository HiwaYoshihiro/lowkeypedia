import { expect, test } from '@playwright/test';

test('gợi ý ở header dẫn tới trang chi tiết', async ({ page }) => {
  await page.goto('/');

  const input = page.getByRole('combobox', { name: 'Tìm kiếm trong Lwkypedia' });
  await input.fill('lai bang');

  const option = page.getByRole('option', { name: /Lai Bâng/ });
  await expect(option).toBeVisible();
  await option.click();

  await expect(page).toHaveURL(/\/tuyen-thu\/lai-bang$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lai Bâng');
});

test('trang tìm kiếm hiện kết quả theo từ khoá', async ({ page }) => {
  await page.goto('/tim-kiem?q=lai');

  await expect(page.getByText(/Tìm thấy \d+ kết quả/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lai Bâng' })).toBeVisible();
});

test('trang tìm kiếm hiện trạng thái rỗng với từ khoá lạ', async ({ page }) => {
  await page.goto('/tim-kiem?q=zzzzzzz');

  await expect(page.getByText('Không tìm thấy kết quả nào')).toBeVisible();
  await expect(page.getByText('0 kết quả')).toBeVisible();
});
