import { expect, test, type Page } from '@playwright/test';

/**
 * E2E luồng quản trị trên Blob store TEST (không bao giờ chạm dữ liệu thật).
 *
 * Mọi thực thể tạo ra đều mang hậu tố thời gian và được dọn ở cuối test.
 * Chạy tuần tự trong file để thứ tự cascade (team → player, tournament →
 * achievement) không phụ thuộc lịch của Playwright.
 */
test.describe.configure({ mode: 'serial' });

const PASSWORD = process.env.ADMIN_PASSWORD_TEST ?? '';
const STAMP = Date.now();

/** Tạo hậu tố duy nhất cho từng lần chạy (kể cả khi retry). */
function unique(label: string): string {
  return `${label} ${STAMP}-${Math.floor(Math.random() * 1000)}`;
}

async function login(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.getByPlaceholder('Nhập mật khẩu quản trị').fill(PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Bảng quản trị' })).toBeVisible();
}

/** Khu vực modal đang mở, phân biệt bằng tiêu đề. */
function modal(page: Page, heading: string | RegExp) {
  return page
    .locator('.fixed.inset-0')
    .filter({ has: page.getByRole('heading', { name: heading }) });
}

/** Bảng danh sách của tab hiện tại có chứa text cho trước. */
function rowOf(page: Page, text: string) {
  return page.getByRole('row').filter({ hasText: text });
}

async function apiJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  return (await response.json()) as T;
}

test.describe('Đăng nhập quản trị', () => {
  test('mật khẩu sai hiện lỗi và vẫn ở trang đăng nhập', async ({ page }) => {
    await page.goto('/admin');

    await page.getByPlaceholder('Nhập mật khẩu quản trị').fill('mat-khau-sai-hoan-toan');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByText('Mật khẩu không đúng')).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('mật khẩu đúng vào bảng quản trị với 3 tab', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('button', { name: /^Tuyển thủ \(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Đội tuyển \(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Giải đấu \(\d+\)$/ })).toBeVisible();
  });
});

test.describe('CRUD tuyển thủ', () => {
  test('tạo, đổi slug và xoá tuyển thủ', async ({ page }) => {
    await login(page);
    const ign = unique('Test Player');
    const newSlug = `test-player-${STAMP}-slug`;

    await page.getByRole('button', { name: '+ Thêm tuyển thủ' }).click();
    const form = modal(page, 'Thêm tuyển thủ mới');
    const inputs = form.getByRole('textbox');
    await inputs.nth(0).fill(ign);
    await form.locator('select').nth(0).selectOption('Xạ Thủ');
    await form.getByRole('button', { name: 'Lưu' }).click();

    await expect(form).toBeHidden();
    await expect(rowOf(page, ign)).toBeVisible();

    await rowOf(page, ign).getByRole('button', { name: 'Sửa' }).click();
    const editForm = modal(page, /^Sửa tuyển thủ:/);
    await editForm.getByRole('textbox').nth(2).fill(newSlug);
    await editForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(editForm).toBeHidden();

    const players = await apiJson<Array<{ ign: string; slug: string; id: string }>>(
      page,
      '/api/admin/players'
    );
    const created = players.find((p) => p.ign === ign);
    expect(created?.slug).toBe(newSlug);

    page.on('dialog', (dialog) => dialog.accept());
    await rowOf(page, ign).getByRole('button', { name: 'Xoá' }).click();

    await expect(rowOf(page, ign)).toHaveCount(0);
    const after = await apiJson<Array<{ ign: string }>>(page, '/api/admin/players');
    expect(after.some((p) => p.ign === ign)).toBe(false);
  });
});

test.describe('CRUD đội tuyển + cascade', () => {
  test('đổi slug đội cập nhật teamSlug của tuyển thủ, xoá đội gỡ liên kết', async ({
    page,
  }) => {
    await login(page);
    const teamName = unique('Test Team');
    const playerIgn = unique('Test Cascade Player');
    const newSlug = `test-team-${STAMP}-doi-slug`;

    // 1. Tạo đội.
    await page.getByRole('button', { name: /^Đội tuyển \(\d+\)$/ }).click();
    await page.getByRole('button', { name: '+ Thêm đội tuyển' }).click();
    const teamForm = modal(page, 'Thêm đội tuyển mới');
    await teamForm.getByRole('textbox').nth(0).fill(teamName);
    await teamForm.getByRole('textbox').nth(1).fill('TST');
    await teamForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(teamForm).toBeHidden();
    await expect(rowOf(page, teamName)).toBeVisible();

    type TeamRow = { id: string; slug: string; name: string };
    const teamsAfterCreate = await apiJson<TeamRow[]>(page, '/api/admin/teams');
    const createdTeam = teamsAfterCreate.find((t) => t.name === teamName);
    expect(createdTeam, 'đội vừa tạo phải có trong API').toBeTruthy();
    const originalSlug = createdTeam!.slug;

    // 2. Tạo tuyển thủ thuộc đội đó.
    await page.getByRole('button', { name: /^Tuyển thủ \(\d+\)$/ }).click();
    await page.getByRole('button', { name: '+ Thêm tuyển thủ' }).click();
    const playerForm = modal(page, 'Thêm tuyển thủ mới');
    await playerForm.getByRole('textbox').nth(0).fill(playerIgn);
    await playerForm.locator('select').nth(1).selectOption(originalSlug);
    await playerForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(playerForm).toBeHidden();

    type PlayerRow = {
      id: string;
      ign: string;
      teamSlug: string | null;
      achievements: Array<{ tournament: string; tournamentSlug?: string }>;
    };
    let players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    expect(players.find((p) => p.ign === playerIgn)?.teamSlug).toBe(originalSlug);

    // 3. Đổi slug đội → tuyển thủ đi theo.
    await page.getByRole('button', { name: /^Đội tuyển \(\d+\)$/ }).click();
    await rowOf(page, teamName).getByRole('button', { name: 'Sửa' }).click();
    const teamEditForm = modal(page, /^Sửa đội tuyển:/);
    await teamEditForm.getByRole('textbox').nth(2).fill(newSlug);
    await teamEditForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(teamEditForm).toBeHidden();

    players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    expect(players.find((p) => p.ign === playerIgn)?.teamSlug).toBe(newSlug);

    // 4. Xoá đội → tuyển thủ thành tự do.
    page.on('dialog', (dialog) => dialog.accept());
    await rowOf(page, teamName).getByRole('button', { name: 'Xoá' }).click();
    await expect(rowOf(page, teamName)).toHaveCount(0);

    players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    expect(players.find((p) => p.ign === playerIgn)?.teamSlug).toBeNull();

    // Dọn tuyển thủ.
    await page.getByRole('button', { name: /^Tuyển thủ \(\d+\)$/ }).click();
    await rowOf(page, playerIgn).getByRole('button', { name: 'Xoá' }).click();
    await expect(rowOf(page, playerIgn)).toHaveCount(0);
  });
});

test.describe('CRUD giải đấu + cascade thành tích', () => {
  test('đổi slug giải cập nhật tournamentSlug, xoá giải gỡ liên kết', async ({ page }) => {
    await login(page);
    const cupName = unique('Test Cup');
    const playerIgn = unique('Test Trophy Player');
    const newSlug = `test-cup-${STAMP}-doi-slug`;

    type TournamentRow = { id: string; slug: string; name: string };
    type PlayerRow = {
      id: string;
      ign: string;
      achievements: Array<{ tournament: string; tournamentSlug?: string }>;
    };

    // 1. Tạo giải.
    await page.getByRole('button', { name: /^Giải đấu \(\d+\)$/ }).click();
    await page.getByRole('button', { name: '+ Thêm giải đấu' }).click();
    const cupForm = modal(page, 'Thêm giải đấu mới');
    await cupForm.getByRole('textbox').nth(0).fill(cupName);
    await cupForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(cupForm).toBeHidden();
    await expect(rowOf(page, cupName)).toBeVisible();

    const cups = await apiJson<TournamentRow[]>(page, '/api/admin/tournaments');
    const createdCup = cups.find((t) => t.name === cupName);
    expect(createdCup, 'giải vừa tạo phải có trong API').toBeTruthy();
    const originalSlug = createdCup!.slug;

    // 2. Tạo tuyển thủ có thành tích trỏ tới giải đó.
    await page.getByRole('button', { name: /^Tuyển thủ \(\d+\)$/ }).click();
    await page.getByRole('button', { name: '+ Thêm tuyển thủ' }).click();
    const playerForm = modal(page, 'Thêm tuyển thủ mới');
    await playerForm.getByRole('textbox').nth(0).fill(playerIgn);
    await playerForm.getByRole('button', { name: '+ Thêm dòng thành tích' }).click();

    const textboxes = playerForm.getByRole('textbox');
    const total = await textboxes.count();
    await textboxes.nth(total - 3).fill('2026');
    await textboxes.nth(total - 2).fill('Vô địch');
    await textboxes.nth(total - 1).fill(cupName);
    // select 0 = vị trí, 1 = đội hiện tại, 2 = link giải của dòng thành tích.
    await playerForm.locator('select').nth(2).selectOption(originalSlug);
    await playerForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(playerForm).toBeHidden();

    let players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    expect(players.find((p) => p.ign === playerIgn)?.achievements[0]?.tournamentSlug).toBe(
      originalSlug
    );

    // 3. Đổi slug giải → thành tích đi theo.
    await page.getByRole('button', { name: /^Giải đấu \(\d+\)$/ }).click();
    await rowOf(page, cupName).getByRole('button', { name: 'Sửa' }).click();
    const cupEditForm = modal(page, /^Sửa giải đấu:/);
    await cupEditForm.getByRole('textbox').nth(1).fill(newSlug);
    await cupEditForm.getByRole('button', { name: 'Lưu' }).click();
    await expect(cupEditForm).toBeHidden();

    players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    expect(players.find((p) => p.ign === playerIgn)?.achievements[0]?.tournamentSlug).toBe(
      newSlug
    );

    // 4. Xoá giải → chỉ gỡ slug, giữ tên giải dạng chữ.
    page.on('dialog', (dialog) => dialog.accept());
    await rowOf(page, cupName).getByRole('button', { name: 'Xoá' }).click();
    await expect(rowOf(page, cupName)).toHaveCount(0);

    players = await apiJson<PlayerRow[]>(page, '/api/admin/players');
    const achievement = players.find((p) => p.ign === playerIgn)?.achievements[0];
    expect(achievement?.tournament).toBe(cupName);
    expect(achievement?.tournamentSlug).toBeUndefined();

    // Dọn tuyển thủ.
    await page.getByRole('button', { name: /^Tuyển thủ \(\d+\)$/ }).click();
    await rowOf(page, playerIgn).getByRole('button', { name: 'Xoá' }).click();
    await expect(rowOf(page, playerIgn)).toHaveCount(0);
  });
});

test.describe('Đăng xuất', () => {
  test('đăng xuất quay về /admin và API trả 401', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Đăng xuất' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    const response = await page.request.get('/api/admin/players');
    expect(response.status()).toBe(401);
  });
});
