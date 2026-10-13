import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Crumb {
  label: ReactNode;
  href?: string;
}

/** Đường dẫn phân cấp: Trang chủ › Tuyển thủ › Lai Bâng */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Đường dẫn">
      {items.map((item, index) => (
        <span key={index} style={{ display: 'contents' }}>
          {index > 0 && (
            <span className="breadcrumb-sep" aria-hidden="true">
              ›
            </span>
          )}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
