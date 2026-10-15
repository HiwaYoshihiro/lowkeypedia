import { NextResponse } from 'next/server';
import { ValidationError } from '@/lib/store';

/**
 * Chuyển lỗi thành response mà không rò rỉ chi tiết nội bộ.
 *
 * - `ValidationError` (dữ liệu admin nhập sai) → 400 kèm thông báo cụ thể.
 * - Mọi lỗi khác (Blob, cấu hình thiếu…) → 500 với thông báo chung; chi tiết
 *   chỉ ghi ra log phía server.
 */
export function failure(error: unknown, fallback: string): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(`[lwkypedia] ${fallback}:`, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}