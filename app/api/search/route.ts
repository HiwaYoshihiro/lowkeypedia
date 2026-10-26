import { searchAll } from '@/lib/store';
import {
  SEARCH_RATE_LIMIT_MAX,
  SEARCH_RATE_WINDOW_MS,
  checkRateLimit,
  clientIp,
} from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

/**
 * API tìm kiếm cho gợi ý ở header.
 *
 * Dùng lại `searchAll` của `lib/store` nên vẫn đọc từ Vercel Blob và hưởng cache
 * in-memory 30 giây; không cần thêm lớp dữ liệu nào.
 *
 * Có giới hạn tần suất riêng (60 request/phút/IP) để một client không quét được
 * toàn bộ dữ liệu bằng cách gọi liên tục. Ngưỡng này tách khỏi ngưỡng đăng nhập:
 * khoá có tiền tố `search:` nên hai bộ đếm không giẫm lên nhau, và bộ đếm nằm
 * trong bộ nhớ tiến trình (xem ghi chú trong `lib/ratelimit.ts`) — đủ để giảm nhẹ
 * trên một instance, không phải giới hạn toàn cụm.
 */
export async function GET(request: Request) {
  const gate = checkRateLimit(
    `search:${clientIp(request)}`,
    SEARCH_RATE_LIMIT_MAX,
    SEARCH_RATE_WINDOW_MS
  );
  if (gate.limited) {
    // 429 không được cache: nếu CDN giữ lại thì người dùng khác cũng bị chặn oan.
    return Response.json(
      { error: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(gate.retryAfter),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const q = new URL(request.url).searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json([]);

  try {
    const results = await searchAll(q);
    // Cho phép cache ngắn ở CDN: gợi ý không cần tươi từng mili-giây, và người
    // dùng gõ lại cùng một tiền tố sẽ không tốn thêm lượt gọi server.
    return Response.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[lowkeypedia] /api/search lỗi:', error);
    return Response.json({ error: 'Không tìm kiếm được' }, { status: 500 });
  }
}
