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

  it('dọn bucket hết hạn khi có hơn 1000 IP', async () => {
    const rl = await loadRatelimit('1');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    for (let i = 0; i < 1001; i += 1) rl.noteFailure(`ip-${i}`);
    expect(rl.isRateLimited('ip-0')).toBe(true);

    // Sang cửa sổ mới, lần ghi kế tiếp vượt 1000 bucket → dọn các bucket đã hết hạn.
    vi.setSystemTime(new Date('2026-01-01T00:11:00Z'));
    rl.noteFailure('ip-moi');

    expect(rl.isRateLimited('ip-0')).toBe(false);
    expect(rl.isRateLimited('ip-moi')).toBe(true);
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

describe('checkRateLimit (giới hạn chung cho route đọc)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('cho qua đúng max request rồi chặn request kế tiếp', async () => {
    const rl = await loadRatelimit();
    const key = 'search:1.2.3.4';

    for (let i = 0; i < 3; i += 1) {
      expect(rl.checkRateLimit(key, 3, 60_000)).toEqual({ limited: false, retryAfter: 0 });
    }
    expect(rl.checkRateLimit(key, 3, 60_000)).toEqual({ limited: true, retryAfter: 60 });
  });

  it('Retry-After tính theo phần cửa sổ còn lại', async () => {
    const rl = await loadRatelimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const key = 'search:retry';

    expect(rl.checkRateLimit(key, 1, 60_000).limited).toBe(false);
    vi.setSystemTime(new Date('2026-01-01T00:00:20Z'));

    const blocked = rl.checkRateLimit(key, 1, 60_000);
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfter).toBe(40);
  });

  it('hết cửa sổ thì đếm lại từ đầu', async () => {
    const rl = await loadRatelimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const key = 'search:window';

    rl.checkRateLimit(key, 1, 60_000);
    expect(rl.checkRateLimit(key, 1, 60_000).limited).toBe(true);

    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));
    expect(rl.checkRateLimit(key, 1, 60_000).limited).toBe(false);
  });

  it('khoá search và bộ đếm đăng nhập không ảnh hưởng lẫn nhau', async () => {
    const rl = await loadRatelimit('2');
    const ip = '1.2.3.4';

    rl.checkRateLimit(`search:${ip}`, 1, 60_000);
    // Bộ đếm login của cùng IP vẫn trống dù đã dùng hết lượt tìm kiếm.
    expect(rl.isRateLimited(ip)).toBe(false);

    rl.noteFailure(ip);
    rl.noteFailure(ip);
    expect(rl.isRateLimited(ip)).toBe(true);
    // Ghi nhận thất bại đăng nhập không cộng vào bộ đếm search.
    expect(rl.checkRateLimit(`search:${ip}`, 1, 60_000).limited).toBe(true);
  });

  it('dọn bucket hết hạn theo đúng cửa sổ của từng khoá', async () => {
    const rl = await loadRatelimit();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    // Khoá `x` đã dùng 2 lượt với ngưỡng 1 → đang bị chặn.
    rl.checkRateLimit('search:x', 1, 60_000);
    expect(rl.checkRateLimit('search:x', 1, 60_000).limited).toBe(true);

    // Nhồi thêm 1000 bucket để lần tạo bucket kế tiếp kích hoạt dọn dẹp.
    for (let i = 0; i < 1000; i += 1) rl.checkRateLimit(`search:ip-${i}`, 60, 60_000);

    // Sang cửa sổ mới của khoá search (60 giây), tạo bucket mới → dọn bucket cũ.
    vi.setSystemTime(new Date('2026-01-01T00:02:00Z'));
    rl.checkRateLimit('search:moi', 60, 60_000);

    // Bucket `x` đã bị xoá nên lượt này được tính lại từ đầu → được phép.
    expect(rl.checkRateLimit('search:x', 1, 60_000).limited).toBe(false);
  });
});
