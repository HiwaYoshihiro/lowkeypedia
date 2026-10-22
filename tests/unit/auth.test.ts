// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Cookie jar giả: `cookies()` của Next chỉ được test điều khiển.
 * Dùng `vi.hoisted` vì factory của `vi.mock` chạy trước các khai báo const.
 */
const jar = vi.hoisted(() => {
  const state: { value: string | undefined; options: Record<string, unknown> | undefined } = {
    value: undefined,
    options: undefined,
  };
  const set = vi.fn((_name: string, value: string, options?: Record<string, unknown>) => {
    state.value = value;
    state.options = options;
  });
  const get = vi.fn(() => (state.value === undefined ? undefined : { value: state.value }));
  return { state, set, get };
});

vi.mock('next/headers', () => ({
  cookies: () => ({ get: jar.get, set: jar.set }),
}));

import { clearAdminCookie, isAdmin, requireAdmin, setAdminCookie, verifyPassword } from '@/lib/auth';

const SECRET = 'a'.repeat(32);

/** Cookie hợp lệ vừa được cấp. */
async function validCookie(): Promise<string> {
  await setAdminCookie();
  const value = jar.state.value;
  if (!value) throw new Error('setAdminCookie không ghi cookie');
  return value;
}

describe('auth', () => {
  beforeEach(() => {
    jar.state.value = undefined;
    jar.state.options = undefined;
    jar.set.mockClear();
    jar.get.mockClear();
    vi.stubEnv('ADMIN_SECRET', SECRET);
    vi.stubEnv('ADMIN_PASSWORD', 'mat-khau-dung');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('verifyPassword', () => {
    it('đúng mật khẩu trả true', () => {
      expect(verifyPassword('mat-khau-dung')).toBe(true);
    });

    it('sai mật khẩu trả false', () => {
      expect(verifyPassword('mat-khau-sai')).toBe(false);
    });

    it('ném lỗi khi chưa cấu hình ADMIN_PASSWORD', () => {
      vi.stubEnv('ADMIN_PASSWORD', '');
      expect(() => verifyPassword('bat-ky')).toThrow('ADMIN_PASSWORD chưa được cấu hình');
    });
  });

  describe('phiên đăng nhập', () => {
    it('cookie vừa cấp được chấp nhận', async () => {
      await validCookie();
      expect(await isAdmin()).toBe(true);
    });

    it('cookie bị sửa một ký tự bị từ chối', async () => {
      const value = await validCookie();
      const last = value.at(-1);
      const tampered = value.slice(0, -1) + (last === 'a' ? 'b' : 'a');
      jar.state.value = tampered;
      expect(await isAdmin()).toBe(false);
    });

    it('cookie sai định dạng bị từ chối', async () => {
      jar.state.value = 'abc';
      expect(await isAdmin()).toBe(false);
      jar.state.value = 'abc.def.ghi';
      expect(await isAdmin()).toBe(false);
    });

    it('cookie hết hạn sau 7 ngày bị từ chối', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      await validCookie();
      expect(await isAdmin()).toBe(true);
      vi.setSystemTime(new Date('2026-01-09T00:00:01Z'));
      expect(await isAdmin()).toBe(false);
    });

    it('ghi cookie với thuộc tính an toàn', async () => {
      await validCookie();
      expect(jar.state.options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 604800,
        path: '/',
      });
    });

    it('xoá cookie đặt maxAge 0', async () => {
      await clearAdminCookie();
      expect(jar.state.options).toMatchObject({ maxAge: 0, path: '/' });
    });
  });

  describe('requireAdmin', () => {
    it('trả 401 khi chưa đăng nhập', async () => {
      const res = await requireAdmin();
      expect(res).not.toBeNull();
      expect(res?.status).toBe(401);
      expect(await res?.json()).toEqual({ error: 'Chưa đăng nhập quản trị' });
    });

    it('trả null khi đã đăng nhập', async () => {
      await validCookie();
      expect(await requireAdmin()).toBeNull();
    });
  });
});
