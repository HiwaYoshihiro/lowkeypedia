import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="wiki-footer">
      <div className="wiki-footer-inner">
        <div>
          <p className="wiki-brand-mini">
            LOWKEY<span className="wiki-gold">PEDIA</span>
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam — tuyển thủ, đội tuyển, giải đấu và sự nghiệp của họ.
          </p>
        </div>
        <nav>
          <Link href="/">Trang chủ</Link>
          <Link href="/tuyen-thu">Tuyển thủ</Link>
          <Link href="/doi-tuyen">Đội tuyển</Link>
          <Link href="/giai-dau">Giải đấu</Link>
          <Link href="/admin">Quản trị</Link>
        </nav>
      </div>
      <p className="wiki-footer-note">
        Dữ liệu do cộng đồng đóng góp — có thể chỉnh sửa qua trang quản trị.
      </p>
    </footer>
  );
}
