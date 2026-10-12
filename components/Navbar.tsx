'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const TABS = [
  { href: '/', label: 'Trang chủ', match: (p: string) => p === '/' },
  { href: '/tuyen-thu', label: 'Tuyển thủ', match: (p: string) => p.startsWith('/tuyen-thu') },
  { href: '/doi-tuyen', label: 'Đội tuyển', match: (p: string) => p.startsWith('/doi-tuyen') },
  { href: '/giai-dau', label: 'Giải đấu', match: (p: string) => p.startsWith('/giai-dau') },
  { href: '/tim-kiem', label: 'Tìm kiếm', match: (p: string) => p.startsWith('/tim-kiem') },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <header className="wiki-header">
        <Link href="/" className="wiki-brand">
          <h1>
            LOWKEY<span className="wiki-gold">PEDIA</span>
          </h1>
          <span className="wiki-tagline">Wiki Liên Quân Mobile Việt Nam</span>
        </Link>
        <div className="wiki-header-actions">
          <ThemeToggle />
          <Link href="/admin" className="wiki-icon-btn">
            Quản trị
          </Link>
        </div>
      </header>
      <nav className="wiki-tabs" aria-label="Điều hướng chính">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`tab-btn${t.match(pathname) ? ' active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
