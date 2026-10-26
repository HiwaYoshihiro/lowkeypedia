'use client';

import { useSyncExternalStore } from 'react';

/**
 * Đổi giao diện sáng/tối.
 *
 * Trước đây gắn class `dark-mode` lên <body> SAU lần render đầu nên trang bị nháy
 * sáng rồi mới tối. Nay ghi `data-theme` lên <html>, và một script nhỏ trong
 * `app/layout.tsx` đặt giá trị đó trước khi React chạy.
 *
 * Trạng thái đọc thẳng từ `<html data-theme>` qua `useSyncExternalStore` thay vì
 * `useEffect` + `setState`: đọc DOM là nguồn sự thật bên ngoài React, nên cách này
 * vừa đúng ngay từ lần vẽ đầu, vừa không tạo thêm vòng render thừa.
 */

const THEME_EVENT = 'lwkypedia:themechange';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onStoreChange);
  // Đổi theme ở tab khác cũng cập nhật nút bấm ở tab này.
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function isDark(): boolean {
  return document.documentElement.dataset.theme === 'dark';
}

/** Lúc render trên server chưa có DOM — mặc định giao diện sáng. */
function isDarkOnServer(): boolean {
  return false;
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, isDarkOnServer);

  function toggle() {
    const next = !dark;
    const root = document.documentElement;
    root.dataset.theme = next ? 'dark' : 'light';
    root.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* localStorage có thể bị chặn */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
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
