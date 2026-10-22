import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `lib/site.ts` đọc biến môi trường ngay lúc module load, nên mỗi test phải
 * nạp lại module sau khi stub env.
 */
async function loadSite() {
  vi.resetModules();
  return import('@/lib/site');
}

describe('site constants', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('dùng giá trị mặc định khi không có biến môi trường', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_NAME', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_TAGLINE', '');
    const site = await loadSite();
    expect(site.SITE_NAME).toBe('LWKYPEDIA');
    expect(site.SITE_NAME_HEAD).toBe('LWKY');
    expect(site.SITE_NAME_TAIL).toBe('PEDIA');
    expect(site.SITE_URL).toBe('https://lwkypedia.vercel.app');
  });

  it('cho phép ghi đè tên qua biến môi trường', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_NAME', 'LIÊN QUÂN WIKI');
    const site = await loadSite();
    expect(site.SITE_NAME).toBe('LIÊN QUÂN WIKI');
  });

  it('cho phép ghi đè URL gốc', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    const site = await loadSite();
    expect(site.SITE_URL).toBe('https://example.com');
  });
});
