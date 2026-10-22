import { vi } from 'vitest';

/**
 * Blob giả trong bộ nhớ cho unit test `lib/store.ts`.
 *
 * - `mockList` / `mockPut` thay cho hai hàm của `@vercel/blob` (test file tự
 *   đăng ký `vi.mock` và trỏ tới hai hàm này).
 * - `fetch` giả đọc nội dung file từ `blob.files` theo pathname của URL, bỏ qua
 *   query `?cb=` mà store thêm để cache-bust.
 * - `blob.failNextRead` bật lên để giả lập lỗi mạng ở lần đọc kế tiếp.
 */

export const blob = {
  files: new Map<string, string>(),
  failNextRead: false,
};

export const mockList = vi.fn();
export const mockPut = vi.fn();

/** Blob descriptor tối thiểu mà `store.ts` dùng (`pathname` + `url`). */
export function blobFor(pathname: string) {
  return { pathname, url: `https://blob.test/${pathname}` };
}

/** Đặt nội dung một file và trả descriptor để đưa vào `mockList`. */
export function seedFile(pathname: string, data: unknown) {
  blob.files.set(pathname, JSON.stringify(data));
  return blobFor(pathname);
}

/** Cho `list()` trả đúng các file đang có trong bộ nhớ giả. */
export function listFromFiles(): void {
  mockList.mockResolvedValue({ blobs: Array.from(blob.files.keys()).map(blobFor) });
}

/** Cài `fetch` giả đọc từ `blob.files`. */
export function installFakeFetch(): void {
  // `put` phải ghi vào bộ nhớ giả thì các bước đọc-lại-mới thấy dữ liệu vừa lưu.
  mockPut.mockImplementation(async (pathname: string, body: string) => {
    blob.files.set(pathname, body);
    return blobFor(pathname);
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const pathname = new URL(url).pathname.replace(/^\//, '');
      if (blob.failNextRead) throw new Error('network down');
      const content = blob.files.get(pathname);
      if (content === undefined) return new Response('not found', { status: 404 });
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
}

/**
 * Xoá toàn bộ trạng thái giả và cache của store.
 *
 * `clearCache` được import động để tránh vòng import store → @vercel/blob →
 * helper → store lúc module khởi tạo; lúc gọi (afterEach) module đã sẵn sàng.
 */
export async function resetFakeBlob(): Promise<void> {
  blob.files.clear();
  blob.failNextRead = false;
  mockList.mockReset();
  mockPut.mockReset();
  mockList.mockResolvedValue({ blobs: [] });
  const { clearCache } = await import('@/lib/store');
  clearCache();
}
