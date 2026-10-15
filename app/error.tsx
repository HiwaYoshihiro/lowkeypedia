'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArticleShell } from '@/components/ArticleShell';

/**
 * Lưới an toàn khi một trang ném lỗi lúc render.
 *
 * `reset()` thử render lại đúng đoạn bị lỗi mà không tải lại cả trang. Chi tiết
 * lỗi chỉ ghi ra console — không hiển thị cho người xem vì có thể lộ thông tin
 * nội bộ; chỉ mã `digest` (nếu có) được hiện để tiện đối chiếu log.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[lwkypedia] lỗi khi render trang:', error);
  }, [error]);

  return (
    <ArticleShell title="Đã xảy ra lỗi">
      <p className="lead">
        Trang này không tải được. Phần lớn trường hợp chỉ là lỗi tạm thời — thử lại
        thường là đủ.
      </p>

      <div className="chip-row">
        <button type="button" className="btn" onClick={reset}>
          ↻ Thử lại
        </button>
        <Link href="/" className="btn">
          🏠 Về trang chủ
        </Link>
        <Link href="/tuyen-thu" className="btn">
          🎮 Xem tuyển thủ
        </Link>
      </div>

      {error.digest ? (
        <p className="card-subtitle" style={{ marginTop: 18 }}>
          Mã lỗi (đối chiếu khi báo lỗi): <strong>{error.digest}</strong>
        </p>
      ) : null}
    </ArticleShell>
  );
}
