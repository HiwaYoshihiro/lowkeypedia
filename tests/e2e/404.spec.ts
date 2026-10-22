import { expect, test } from '@playwright/test';

test('slug tuyển thủ không tồn tại hiện trang not-found và có lối về trang chủ', async ({
  page,
}) => {
  await page.goto('/tuyen-thu/slug-khong-ton-tai-xyz');

  // Trang chi tiết dùng loading.tsx nên Next streaming trả HTTP 200 và xử lý
  // notFound() ở client; điều cần kiểm tra là người dùng thấy trang not-found.
  await expect(
    page.getByRole('heading', { name: 'Không tìm thấy nội dung' })
  ).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('link', { name: /Trang chủ/ })
  ).toHaveAttribute('href', '/');
});

test('đường dẫn lạ trả 404', async ({ page }) => {
  const response = await page.goto('/duong-dan-khong-ton-tai');

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Không tìm thấy nội dung' })
  ).toBeVisible();
});
