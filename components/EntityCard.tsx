import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Thẻ trong lưới danh mục.
 *
 * Dùng <Link> nên bàn phím và screen reader dùng được. Dữ liệu hiện chưa có ảnh
 * nên mặc định hiện chữ cái đầu, có ảnh thì hiện ảnh.
 */
export function EntityCard({
  href,
  title,
  subtitle,
  meta,
  badge,
  accent,
  initial,
  imageUrl,
}: {
  href: string;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  accent: string;
  initial?: string;
  imageUrl?: string;
}) {
  return (
    <Link href={href} className="card" style={{ '--card-accent': accent } as React.CSSProperties}>
      <span className="card-media is-contain">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="card-initial" aria-hidden="true">
            {(initial ?? title).charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="card-body">
        <span className="card-badge-row">
          <span className="card-title">{title}</span>
          {badge}
        </span>
        {subtitle ? <span className="card-subtitle">{subtitle}</span> : null}
        {meta ? <span className="card-meta">{meta}</span> : null}
      </span>
    </Link>
  );
}
