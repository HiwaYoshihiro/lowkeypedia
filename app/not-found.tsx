import Link from 'next/link';
import { ArticleShell } from '@/components/ArticleShell';

export default function NotFound() {
  return (
    <ArticleShell title="Không tìm thấy nội dung">
      <p className="lead">
        Đường dẫn này không tồn tại, hoặc bản ghi đã bị xoá khỏi cơ sở dữ liệu.
      </p>

      <h2 className="wiki-h2">Đi tới một mục khác</h2>
      <div className="chip-row">
        <Link href="/" className="btn btn-sm">
          🏠 Trang chủ
        </Link>
        <Link href="/tuyen-thu" className="btn btn-sm">
          🎮 Tuyển thủ
        </Link>
        <Link href="/doi-tuyen" className="btn btn-sm">
          🛡️ Đội tuyển
        </Link>
        <Link href="/giai-dau" className="btn btn-sm">
          🏆 Giải đấu
        </Link>
      </div>

      <p style={{ marginTop: 18 }}>
        Hoặc dùng ô tìm kiếm ở đầu trang (<span className="kbd">Ctrl</span>+
        <span className="kbd">K</span>) để tra cứu toàn bộ cơ sở dữ liệu.
      </p>
    </ArticleShell>
  );
}
