// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixturePlayer, fixtureTeam, fixtureTournament } from '../helpers/fixtures';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getPlayers: vi.fn(),
  getTeams: vi.fn(),
  getTournaments: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.requireAdmin }));

vi.mock('@/lib/store', () => ({
  // `lib/http` chỉ cần lớp lỗi này để phân biệt 400/500. Mock trọn module store
  // sẽ kéo theo `@vercel/blob` và seed, nên ở đây dùng một lớp tối thiểu.
  ValidationError: class ValidationError extends Error {},
  getPlayers: mocks.getPlayers,
  getTeams: mocks.getTeams,
  getTournaments: mocks.getTournaments,
}));

import { GET, dynamic } from '@/app/api/admin/export/route';

/** Giá trị mà `requireAdmin()` trả về khi chưa đăng nhập (xem lib/auth.ts). */
function unauthorized(): Response {
  return Response.json({ error: 'Chưa đăng nhập quản trị' }, { status: 401 });
}

describe('GET /api/admin/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getPlayers.mockResolvedValue([fixturePlayer]);
    mocks.getTeams.mockResolvedValue([fixtureTeam]);
    mocks.getTournaments.mockResolvedValue([fixtureTournament]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('luôn chạy động để không trả bản chụp lúc build', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('trả 401 và không đọc dữ liệu khi chưa đăng nhập', async () => {
    mocks.requireAdmin.mockResolvedValue(unauthorized());

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Chưa đăng nhập quản trị' });
    expect(mocks.getPlayers).not.toHaveBeenCalled();
    expect(mocks.getTeams).not.toHaveBeenCalled();
    expect(mocks.getTournaments).not.toHaveBeenCalled();
  });

  it('trả 200 kèm đủ dữ liệu và header tải file khi đã đăng nhập', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T07:57:04.000Z'));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="lwkypedia-backup-2026-10-26.json"'
    );
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      exportedAt: '2026-10-26T07:57:04.000Z',
      players: [fixturePlayer],
      teams: [fixtureTeam],
      tournaments: [fixtureTournament],
    });
    expect(mocks.getPlayers).toHaveBeenCalledTimes(1);
    expect(mocks.getTeams).toHaveBeenCalledTimes(1);
    expect(mocks.getTournaments).toHaveBeenCalledTimes(1);
  });

  it('giữ đúng shape khi một bảng chưa có dữ liệu', async () => {
    mocks.getTeams.mockResolvedValue([]);

    const res = await GET();
    const body = (await res.json()) as {
      players: unknown[];
      teams: unknown[];
      tournaments: unknown[];
    };

    expect(res.status).toBe(200);
    expect(body.players).toHaveLength(1);
    expect(body.teams).toEqual([]);
    expect(body.tournaments).toHaveLength(1);
  });

  it('trả 500 và không lộ chi tiết nội bộ khi đọc store thất bại', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getTeams.mockRejectedValue(new Error('BLOB_READ_WRITE_TOKEN chưa cấu hình'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Xuất dữ liệu thất bại' });
    expect(JSON.stringify(body)).not.toContain('BLOB_READ_WRITE_TOKEN');
    expect(spy).toHaveBeenCalled();
  });
});
