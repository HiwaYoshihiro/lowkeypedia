import { searchAll } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API tìm kiếm cho gợi ý ở header.
 *
 * Dùng lại `searchAll` của `lib/store` nên vẫn đọc từ Vercel Blob và hưởng cache
 * in-memory 30 giây; không cần thêm lớp dữ liệu nào.
 */
export async function GET(request: Request) {
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
