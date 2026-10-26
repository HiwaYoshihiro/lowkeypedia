import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import SiteChrome from '@/components/SiteChrome';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import './globals.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/wiki.css';
import '../styles/ui.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lwkypedia — Wiki Liên Quân Mobile Việt Nam',
    template: '%s — Lwkypedia',
  },
  description:
    'Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam: tiểu sử tuyển thủ, đội tuyển, giải đấu, sự nghiệp và thành tích.',
  applicationName: 'Lwkypedia',
  keywords: [
    'Liên Quân Mobile',
    'Arena of Valor',
    'esports Việt Nam',
    'tuyển thủ',
    'đội tuyển',
    'giải đấu',
    'Đấu Trường Danh Vọng',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'vi_VN',
    url: '/',
    title: 'Lwkypedia',
    description: SITE_TAGLINE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lwkypedia',
    description: SITE_TAGLINE,
  },
  robots: { index: true, follow: true },
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


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Proxy sinh nonce cho từng request (xem proxy.ts). Đọc `headers()` ở đây khiến mọi
  // route render động, nhờ đó Next gắn nonce cho toàn bộ script nó phát ra — điều kiện
  // bắt buộc để CSP `'strict-dynamic'` không chặn nhầm JS của chính mình.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="vi">
      <body>
        {/* Script đồng bộ 1KB, chạy trước lần vẽ đầu để không nháy sai theme. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" nonce={nonce} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
