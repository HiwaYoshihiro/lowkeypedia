import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lowkeypedia — Wiki Liên Quân Mobile Việt Nam',
  description:
    'Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam: tiểu sử tuyển thủ, đội tuyển, giải đấu, sự nghiệp và thành tích.',
};

// Đặt class dark-mode lên <body> trước khi trình duyệt vẽ trang (tránh FOUC).
// Script inline chạy đồng bộ ngay khi parser gặp thẻ script đầu body.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.body.classList.add('dark-mode');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="wiki-container">
          <Navbar />
          <div className="wiki-page">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
