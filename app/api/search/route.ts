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
    return Response.json(results);
  } catch (error) {
    console.error('[lowkeypedia] /api/search lỗi:', error);
    return Response.json({ error: 'Không tìm kiếm được' }, { status: 500 });
  }
}
