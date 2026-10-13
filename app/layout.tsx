import type { Metadata, Viewport } from 'next';
import SiteChrome from '@/components/SiteChrome';
import { SITE_TAGLINE } from '@/lib/site';
import './globals.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/wiki.css';
import '../styles/ui.css';

export const metadata: Metadata = {
  title: 'Lowkeypedia — Wiki Liên Quân Mobile Việt Nam',
  description:
    'Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam: tiểu sử tuyển thủ, đội tuyển, giải đấu, sự nghiệp và thành tích.',
  openGraph: {
    title: 'Lowkeypedia',
    description: SITE_TAGLINE,
    type: 'website',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1216' },
  ],
};

/**
 * Đặt theme trước khi trình duyệt vẽ trang.
 *
 * Bản cũ gắn class `dark-mode` lên <body> SAU lần render đầu nên bị nháy sáng rồi
 * mới tối. Nay ghi `data-theme` lên <html> và chạy script ngay đầu <body>, khi
 * parser vừa gặp thẻ script — trước khi phần nội dung còn lại được vẽ.
 *
 * `?theme=dark|light` cho phép ép giao diện qua URL, hữu ích khi chia sẻ liên kết.
 */
const themeInitScript = `(function(){try{
var p=new URLSearchParams(location.search).get('theme');
var s=localStorage.getItem('theme');
var t=(p==='dark'||p==='light')?p:((s==='dark'||s==='light')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
var r=document.documentElement;
r.dataset.theme=t;r.style.colorScheme=t;
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
