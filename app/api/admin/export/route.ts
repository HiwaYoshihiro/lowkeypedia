import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPlayers, getTeams, getTournaments } from '@/lib/store';
import { failure } from '@/lib/http';

/**
 * Luôn chạy lúc request: bản backup phải là dữ liệu hiện tại, không phải bản
 * chụp lúc build. `requireAdmin()` đọc cookie nên route vốn đã động, nhưng
 * khai báo tường minh để không ai vô tình bật cache cho một file dữ liệu đầy đủ.
 */
export const dynamic = 'force-dynamic';

/** Ngày trong tên file lấy từ chính `exportedAt` để hai giá trị không lệch nhau. */
function backupFileName(exportedAt: string): string {
  return `lwkypedia-backup-${exportedAt.slice(0, 10)}.json`;
}

/**
 * GET /api/admin/export — tải toàn bộ dữ liệu wiki về một file JSON.
 *
 * Dữ liệu thật nằm trong Vercel Blob và mỗi lần lưu là read-modify-write trên
 * file JSON (không có lịch sử phiên bản), nên một bản sao lưu tải về máy là
 * lớp bảo hiểm duy nhất khi dữ liệu bị sửa/xoá nhầm. Hướng dẫn: docs/backup.md.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    // Ba file độc lập -> đọc song song thay vì cộng dồn độ trễ.
    const [players, teams, tournaments] = await Promise.all([
      getPlayers(),
      getTeams(),
      getTournaments(),
    ]);
    const exportedAt = new Date().toISOString();

    return new NextResponse(
      // Thụt lề 2 dấu cách để file vẫn đọc và đối chiếu được bằng mắt.
      JSON.stringify({ exportedAt, players, teams, tournaments }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${backupFileName(exportedAt)}"`,
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return failure(error, 'Xuất dữ liệu thất bại');
  }
}
