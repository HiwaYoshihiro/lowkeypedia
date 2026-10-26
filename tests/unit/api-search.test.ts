// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test route `/api/search`: trả kết quả + cache header, và giới hạn tần suất
 * riêng (60 request/phút/IP) trả 429 kèm `Retry-After`.
 *
 * Route dùng bộ đếm in-memory của `lib/ratelimit`, nên mỗi test nạp lại module
 * (`vi.resetModules`) để có bảng đếm sạch; `searchAll` được mock để test không
 * cần đọc Vercel Blob.
 */
const mocks = vi.hoisted(() => ({ searchAll: vi.fn() }));

vi.mock('@/lib/store', () => ({ searchAll: mocks.searchAll }));

type SearchRoute = typeof import('@/app/api/search/route');

async function loadRoute(): Promise<SearchRoute> {
  vi.resetModules();
  return import('@/app/api/search/route');
}

function searchRequest(q: string, ip = '9.9.9.9'): Request {
  return new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}`, {
    headers: { 'x-forwarded-for': ip },
  });
}

const PLAYER = { type: 'player', slug: 'lai-bang', title: 'Lai Bâng', subtitle: 'Đi Rừng' };

describe('GET /api/search', () => {
  beforeEach(() => {
    mocks.searchAll.mockReset();
    mocks.searchAll.mockResolvedValue([PLAYER]);
  });

  it('trả kết quả kèm Cache-Control của CDN', async () => {
    const { GET } = await loadRoute();

    const res = await GET(searchRequest('lai'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([PLAYER]);
    expect(res.headers.get('cache-control')).toBe(
      'public, s-maxage=30, stale-while-revalidate=120'
    );
    expect(mocks.searchAll).toHaveBeenCalledWith('lai');
  });

  it('từ khoá rỗng trả mảng rỗng và không tra cứu', async () => {
    const { GET } = await loadRoute();

    const res = await GET(searchRequest('   '));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(mocks.searchAll).not.toHaveBeenCalled();
  });

  it('cho qua 60 request/phút rồi trả 429 kèm Retry-After', async () => {
    const { GET } = await loadRoute();

    for (let i = 0; i < 60; i += 1) {
      const res = await GET(searchRequest('lai'));
      expect(res.status).toBe(200);
    }

    const blocked = await GET(searchRequest('lai'));

    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      error: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau.',
    });
    const retryAfter = Number(blocked.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    // 429 không được để CDN cache, nếu không người dùng khác cũng bị chặn oan.
    expect(blocked.headers.get('cache-control')).toBe('no-store');
    // Request bị chặn không được chạm tới dữ liệu.
    expect(mocks.searchAll).toHaveBeenCalledTimes(60);
  });

  it('mỗi IP có ngân sách riêng', async () => {
    const { GET } = await loadRoute();

    for (let i = 0; i < 60; i += 1) await GET(searchRequest('lai', '1.1.1.1'));
    expect((await GET(searchRequest('lai', '1.1.1.1'))).status).toBe(429);

    expect((await GET(searchRequest('lai', '2.2.2.2'))).status).toBe(200);
  });

  it('ngân sách của /api/search tách khỏi bộ đếm đăng nhập', async () => {
    const { GET } = await loadRoute();
    // Nạp cùng instance `lib/ratelimit` mà route vừa dùng sau `resetModules`.
    const ratelimit = await import('@/lib/ratelimit');
    const ip = '7.7.7.7';

    for (let i = 0; i < 61; i += 1) await GET(searchRequest('lai', ip));

    // Đã cạn lượt tìm kiếm nhưng bộ đếm đăng nhập của IP đó vẫn trống.
    expect(ratelimit.isRateLimited(ip)).toBe(false);

    // Ngược lại, thử sai mật khẩu đủ ngưỡng không làm mất lượt tìm kiếm.
    const other = '8.8.8.8';
    for (let i = 0; i < 8; i += 1) ratelimit.noteFailure(other);
    expect(ratelimit.isRateLimited(other)).toBe(true);
    expect((await GET(searchRequest('lai', other))).status).toBe(200);
  });

  it('trả 500 khi tra cứu ném lỗi', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.searchAll.mockRejectedValue(new Error('blob down'));
    const { GET } = await loadRoute();

    const res = await GET(searchRequest('lai'));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Không tìm kiếm được' });
    error.mockRestore();
  });
});
