import type { ReactNode } from 'react';

/** Khung bài viết: breadcrumb, tiêu đề serif gạch chân, khu vực hành động. */
export function ArticleShell({
  breadcrumb,
  title,
  subtitle,
  actions,
  children,
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="article">
      {breadcrumb}
      <div className="article-head">
        <div className="article-heading">
          <h1 className="article-title">{title}</h1>
          {subtitle ? <div className="article-subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="article-actions">{actions}</div> : null}
      </div>
      {children}
    </article>
  );
}

/** Hai cột: nội dung chính + infobox. Trên mobile infobox đưa lên trước. */
export function ArticleLayout({
  children,
  infobox,
}: {
  children: ReactNode;
  infobox?: ReactNode;
}) {
  return (
    <div className="article-layout">
      <div className="article-body">{children}</div>
      {infobox}
    </div>
  );
}
