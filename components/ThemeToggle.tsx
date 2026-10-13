'use client';

import { useEffect, useState } from 'react';

/**
 * Đổi giao diện sáng/tối.
 *
 * Trước đây gắn class `dark-mode` lên <body> SAU lần render đầu nên trang bị nháy
 * sáng rồi mới tối. Nay ghi `data-theme` lên <html>, và một script nhỏ trong
 * `app/layout.tsx` đặt giá trị đó trước khi React chạy.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.dataset.theme = next ? 'dark' : 'light';
    root.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* localStorage có thể bị chặn */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
