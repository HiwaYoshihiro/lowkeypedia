import Link from 'next/link';
import type { ReactNode } from 'react';

/** Khối mục trên trang chủ: tiêu đề có gạch màu + liên kết "xem tất cả". */
export function SectionBlock({
  title,
  href,
  accent,
  count,
  children,
}: {
  title: string;
  href: string;
  accent: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="section-block" style={{ '--section-accent': accent } as React.CSSProperties}>
      <div className="section-block-head">
        <h2 className="section-block-title">
          {title}
          {typeof count === 'number' ? <span className="result-count">({count})</span> : null}
        </h2>
        <Link href={href} className="link-button section-block-more">
          Xem tất cả →
        </Link>
      </div>
      {children}
    </section>
  );
}
