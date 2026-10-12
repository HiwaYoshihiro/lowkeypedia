import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-wiki-navy text-white/80 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-lg">
              Lowkey<span className="text-wiki-gold">pedia</span>
            </p>
            <p className="text-sm mt-1">
              Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam — tuyển thủ, đội tuyển và sự nghiệp của họ.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="hover:text-wiki-gold">Trang chủ</Link>
            <Link href="/tuyen-thu" className="hover:text-wiki-gold">Tuyển thủ</Link>
            <Link href="/doi-tuyen" className="hover:text-wiki-gold">Đội tuyển</Link>
            <Link href="/admin" className="hover:text-wiki-gold">Quản trị</Link>
          </nav>
        </div>
        <p className="text-xs text-white/50 mt-6 border-t border-white/10 pt-4">
          Dữ liệu do cộng đồng đóng góp — có thể chỉnh sửa qua trang quản trị.
        </p>
      </div>
    </footer>
  );
}
