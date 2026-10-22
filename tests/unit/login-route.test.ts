// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setAdminCookie: vi.fn(),
  verifyPassword: vi.fn(),
  noteFailure: vi.fn(),
  noteSuccess: vi.fn(),
  isRateLimited: vi.fn(() => false),
  clientIp: vi.fn(() => '1.2.3.4'),
}));

vi.mock('@/lib/auth', () => ({
  setAdminCookie: mocks.setAdminCookie,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock('@/lib/ratelimit', () => ({
  clientIp: mocks.clientIp,
  isRateLimited: mocks.isRateLimited,
  noteFailure: mocks.noteFailure,
  noteSuccess: mocks.noteSuccess,
}));

import { POST } from '@/app/api/admin/login/route';

function loginRequest(body: string): Request {
  return new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isRateLimited.mockReturnValue(false);
    mocks.verifyPassword.mockReturnValue(false);
  });

  it('trả 429 khi IP đang bị giới hạn', async () => {
    mocks.isRateLimited.mockReturnValue(true);
    const res = await POST(loginRequest(JSON.stringify({ password: 'x' })));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.',
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('trả 401 và ghi nhận thất bại khi sai mật khẩu', async () => {
    const res = await POST(loginRequest(JSON.stringify({ password: 'sai' })));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Mật khẩu không đúng' });
    expect(mocks.noteFailure).toHaveBeenCalledWith('1.2.3.4');
    expect(mocks.setAdminCookie).not.toHaveBeenCalled();
  });

  it('trả 200 và cấp cookie khi đúng mật khẩu', async () => {
    mocks.verifyPassword.mockReturnValue(true);
    const res = await POST(loginRequest(JSON.stringify({ password: 'dung' })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.setAdminCookie).toHaveBeenCalledTimes(1);
    expect(mocks.noteSuccess).toHaveBeenCalledWith('1.2.3.4');
  });

  it('không sập khi body không phải JSON', async () => {
    const res = await POST(loginRequest('khong-phai-json'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Mật khẩu không đúng' });
  });

  it('trả 500 khi kiểm tra mật khẩu ném lỗi cấu hình', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.verifyPassword.mockImplementation(() => {
      throw new Error('ADMIN_PASSWORD chưa được cấu hình');
    });
    const res = await POST(loginRequest(JSON.stringify({ password: 'x' })));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Không đăng nhập được' });
    vi.restoreAllMocks();
  });
});
