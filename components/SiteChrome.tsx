'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBox from './SearchBox';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import { SITE_NAME_HEAD, SITE_NAME_TAIL, SITE_TAGLINE } from '@/lib/site';

const NAV = [
  { href: '/', label: 'Trang chủ', icon: '🏠', active: (p: string) => p === '/' },
  { href: '/tuyen-thu', label: 'Tuyển thủ', icon: '🎮', active: (p: string) => p.startsWith('/tuyen-thu') },
  { href: '/doi-tuyen', label: 'Đội tuyển', icon: '🛡️', active: (p: string) => p.startsWith('/doi-tuyen') },
  { href: '/giai-dau', label: 'Giải đấu', icon: '🏆', active: (p: string) => p.startsWith('/giai-dau') },
  { href: '/tim-kiem', label: 'Tìm kiếm', icon: '🔍', active: (p: string) => p.startsWith('/tim-kiem') },
];

/**
 * Khung giao diện: header dính, sidebar điều hướng, nội dung, footer.
 *
 * Là client component vì giữ trạng thái mở/đóng sidebar trên mobile; `children`
 * vẫn được render ở phía server nên các trang giữ nguyên Server Component.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);

  // Đổi trang thì đóng sidebar (quan trọng trên mobile).
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <button
            type="button"
            className="icon-btn is-icon-only menu-toggle"
            aria-label={navOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((current) => !current)}
          >
            ☰
          </button>

          <Link href="/" className="logo" aria-label="Lowkeypedia — về trang chủ">
            <span className="logo-mark" aria-hidden="true">
              L
            </span>
            <span className="logo-text">
              <span className="logo-title">
                {SITE_NAME_HEAD}
                <span className="brand-gold">{SITE_NAME_TAIL}</span>
              </span>
              <span className="logo-tagline">{SITE_TAGLINE}</span>
            </span>
          </Link>

          <div className="header-search">
            <SearchBox />
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <Link href="/admin" className="btn btn-sm">
              Quản trị
            </Link>
          </div>
        </div>
      </header>

      <div className="site-body">
        {navOpen ? (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Đóng menu"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <nav className={`site-sidebar scroll-thin${navOpen ? ' is-open' : ''}`} aria-label="Điều hướng">
          <div className="sidebar-head">
            <span className="sidebar-title" style={{ margin: 0 }}>
              Điều hướng
            </span>
            <button
              type="button"
              className="icon-btn is-icon-only sidebar-close"
              aria-label="Đóng menu"
              onClick={() => setNavOpen(false)}
            >
              ×
            </button>
          </div>

          <ul className="nav-list">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link${item.active(pathname) ? ' is-active' : ''}`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="nav-link-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-title">Về Lowkeypedia</div>
          <p className="sidebar-hint" style={{ padding: '0 9px' }}>
            Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam. Dữ liệu lấy từ Liquipedia
            và do cộng đồng bổ sung qua trang quản trị.
          </p>
        </nav>

        <main className="site-main">{children}</main>
      </div>

      <Footer />

      {showToTop ? (
        <button
          type="button"
          className="to-top"
          aria-label="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      ) : null}
    </>
  );
}
