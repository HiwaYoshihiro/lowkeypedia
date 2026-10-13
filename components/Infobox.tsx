import type { ReactNode } from 'react';

/**
 * Hộp thông tin (infobox) bên phải bài viết.
 * `rows` giữ đúng dạng mảng cặp [nhãn, giá trị] mà các trang đang dùng.
 */
export function Infobox({
  title,
  subtitle,
  initial,
  imageUrl,
  accent,
  rows,
}: {
  title: string;
  subtitle?: string;
  initial?: string;
  imageUrl?: string;
  accent?: string;
  rows: [string, ReactNode][];
}) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <aside className="infobox" style={accent ? ({ '--infobox-accent': accent } as React.CSSProperties) : undefined}>
      <div className="infobox-header">{title}</div>
      {subtitle ? <div className="infobox-subheader">{subtitle}</div> : null}

      <div className={`infobox-image is-contain${imageUrl ? '' : ' is-initial'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} loading="lazy" />
        ) : (
          <span className="infobox-initial" aria-hidden="true">
            {(initial ?? title).charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {visible.length > 0 && (
        <table className="infobox-table">
          <tbody>
            {visible.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  );
}
