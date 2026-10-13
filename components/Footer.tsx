import Link from 'next/link';
import { SITE_NAME_HEAD, SITE_NAME_TAIL } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-note">
          <strong>
            {SITE_NAME_HEAD}
            <span className="brand-gold">{SITE_NAME_TAIL}</span>
          </strong>{' '}
          — Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam: tuyển thủ, đội tuyển,
          giải đấu và sự nghiệp của họ. Dữ liệu do cộng đồng đóng góp.
        </div>
        <nav aria-label="Liên kết chân trang">
          <ul className="chip-row" style={{ marginTop: 0, listStyle: 'none', padding: 0 }}>
            <li>
              <Link href="/tuyen-thu">Tuyển thủ</Link>
            </li>
            <li>
              <Link href="/doi-tuyen">Đội tuyển</Link>
            </li>
            <li>
              <Link href="/giai-dau">Giải đấu</Link>
            </li>
            <li>
              <Link href="/tim-kiem">Tìm kiếm</Link>
            </li>
            <li>
              <Link href="/admin">Quản trị</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
