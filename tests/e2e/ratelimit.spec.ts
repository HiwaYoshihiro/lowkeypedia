import { expect, test } from '@playwright/test';

/**
 * Review Focus 5: server cổng 3102 chạy với `LOGIN_RATE_LIMIT_MAX=3`,
 * nên lần thử sai thứ 4 phải bị chặn (429).
 *
 * Mỗi lần chạy dùng một IP giả riêng qua `x-forwarded-for` để bộ đếm trong bộ nhớ
 * không dính trạng thái của lần chạy trước (kể cả khi Playwright retry).
 */
test('4 lần sai mật khẩu liên tiếp bị chặn với thông báo chờ', async ({ page, context }) => {
  const fakeIp = `10.${Math.floor(Math.random() * 250)}.${Math.floor(
    Math.random() * 250
  )}.${Math.floor(Math.random() * 250)}`;
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': fakeIp });

  const statuses: number[] = [];

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.goto('/admin');
    await page.getByPlaceholder('Nhập mật khẩu quản trị').fill(`sai-lan-${attempt}`);
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/login') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Đăng nhập' }).click(),
    ]);
    statuses.push(response.status());
    await expect(page).toHaveURL(/\/admin$/);
  }

  expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
  expect(statuses[3]).toBe(429);
  await expect(
    page.getByText('Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.')
  ).toBeVisible();
});
