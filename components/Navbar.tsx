'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/tuyen-thu', label: 'Tuyển thủ' },
  { href: '/doi-tuyen', label: 'Đội tuyển' },
  { href: '/tim-kiem', label: 'Tìm kiếm' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-wiki-navy text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="bg-wiki-gold text-wiki-navy rounded px-1.5 py-0.5 text-sm font-extrabold">
              LK
            </span>
            <span>
              Lowkey<span className="text-wiki-gold">pedia</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded text-sm font-medium hover:bg-white/10 ${
                  pathname === l.href ? 'bg-white/15 text-wiki-gold' : 'text-white/90'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            className="md:hidden p-2 rounded hover:bg-white/10"
            onClick={() => setOpen(!open)}
            aria-label="Mở menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 pb-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded text-sm font-medium hover:bg-white/10 ${
                pathname === l.href ? 'text-wiki-gold' : 'text-white/90'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
