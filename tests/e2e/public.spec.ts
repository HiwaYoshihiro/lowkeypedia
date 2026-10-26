import { expect, test } from '@playwright/test';

test.describe('Trang chủ', () => {
  test('hiện hero và các mục nội dung chính', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('LWKYPEDIA');
    await expect(page.getByRole('heading', { name: /Tuyển thủ nổi bật/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Đội tuyển/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Giải đấu/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cập nhật gần đây' })).toBeVisible();
  });
});

test.describe('Danh sách tuyển thủ', () => {
  test('hiện danh sách từ seed và lọc theo vị trí', async ({ page }) => {
    await page.goto('/tuyen-thu');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tuyển thủ');

    const cards = page.locator('.card-grid a.card');
    const total = await cards.count();
    expect(total).toBeGreaterThan(0);
    await expect(cards.first()).toBeVisible();

    await page.getByLabel('Lọc theo vị trí').selectOption('Xạ Thủ');
    await page.getByRole('button', { name: 'Lọc' }).click();

    await expect(page).toHaveURL(/role=/);
    const filtered = page.locator('.card-grid a.card');
    // URL đổi trước khi HTML stream xong — chờ thẻ đầu tiên hiện ra rồi mới đếm.
    await expect(filtered.first()).toBeVisible();
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(total);

    const roles = await page.locator('.card-grid .badge-role').allTextContents();
    expect(roles).toEqual(Array.from({ length: filteredCount }, () => 'Xạ Thủ'));
  });

  test('lọc theo đội tuyển', async ({ page }) => {
    await page.goto('/tuyen-thu');
    await expect(page.locator('.card-grid a.card').first()).toBeVisible();

    await page.getByLabel('Lọc theo đội').selectOption('saigon-phantom');
    await page.getByRole('button', { name: 'Lọc' }).click();

    await expect(page).toHaveURL(/team=saigon-phantom/);
    const cards = page.locator('.card-grid a.card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    const teamNames = await page.locator('.card-grid .badge-active').allTextContents();
    expect(teamNames).toEqual(
      Array.from({ length: teamNames.length }, () => 'Saigon Phantom')
    );
  });
});

test.describe('Danh sách đội tuyển và giải đấu', () => {
  test('/doi-tuyen hiện danh sách đội', async ({ page }) => {
    await page.goto('/doi-tuyen');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Đội tuyển');
    await expect(page.locator('.card-grid a.card').first()).toBeVisible();
    await expect(
      page.locator('.card-grid a.card', { hasText: 'Saigon Phantom' })
    ).toBeVisible();
  });

  test('/giai-dau hiện danh sách giải', async ({ page }) => {
    await page.goto('/giai-dau');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Giải đấu');
    await expect(page.locator('.card-grid a.card').first()).toBeVisible();
    await expect(
      page.locator('.card-grid a.card', { hasText: 'Arena of Valor International Championship' })
    ).toBeVisible();
  });
});
