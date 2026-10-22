// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `MAX_ATTEMPTS` đọc biến môi trường lúc module load, còn bộ đếm nằm ở
 * module-level — nên mỗi test nạp lại module để có bucket sạch và env riêng.
 */
async function loadRatelimit(maxAttempts?: string) {
  vi.resetModules();
  vi.stubEnv('LOGIN_RATE_LIMIT_MAX', maxAttempts ?? '');
  return import('@/lib/ratelimit');
}

describe('clientIp', () => {
  it('lấy IP đầu tiên trong x-forwarded-for', async () => {
    const rl = await loadRatelimit();
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
    });
    expect(rl.clientIp(req)).toBe('1.2.3.4');
  });

  it('dùng x-real-ip khi không có x-forwarded-for', async () => {
    const rl = await loadRatelimit();
    const req = new Request('http://localhost', { headers: { 'x-real-ip': '5.6.7.8' } });
    expect(rl.clientIp(req)).toBe('5.6.7.8');
  });

  it('trả unknown khi không có header IP', async () => {
    const rl = await loadRatelimit();
    expect(rl.clientIp(new Request('http://localhost'))).toBe('unknown');
  });
});

describe('rate limit đăng nhập', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('mặc định chặn sau 8 lần thất bại', async () => {
    const rl = await loadRatelimit();
    const key = 'default-ip';
    for (let i = 0; i < 7; i += 1) rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(false);
    rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(true);
  });

  it('LOGIN_RATE_LIMIT_MAX ghi đè số lần tối đa', async () => {
    const rl = await loadRatelimit('3');
    const key = 'override-ip';
    rl.noteFailure(key);
    rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(false);
    rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(true);
  });

  it('hết cửa sổ 10 phút thì bộ đếm vô hiệu', async () => {
    const rl = await loadRatelimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const key = 'window-ip';
    for (let i = 0; i < 8; i += 1) rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(true);
    vi.setSystemTime(new Date('2026-01-01T00:11:00Z'));
    expect(rl.isRateLimited(key)).toBe(false);
  });

  it('đăng nhập thành công xoá bộ đếm của IP', async () => {
    const rl = await loadRatelimit('2');
    const key = 'success-ip';
    rl.noteFailure(key);
    rl.noteFailure(key);
    expect(rl.isRateLimited(key)).toBe(true);
    rl.noteSuccess(key);
    expect(rl.isRateLimited(key)).toBe(false);
  });

  it('các IP khác nhau có bộ đếm riêng', async () => {
    const rl = await loadRatelimit('2');
    rl.noteFailure('ip-a');
    rl.noteFailure('ip-a');
    expect(rl.isRateLimited('ip-a')).toBe(true);
    expect(rl.isRateLimited('ip-b')).toBe(false);
  });
});
