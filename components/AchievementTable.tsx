import Link from 'next/link';
import type { Achievement } from '@/lib/types';

interface Props {
  items: Achievement[];
  title: string;
}

/** Bảng thành tích kiểu Liquipedia: Năm | Thứ hạng | Giải đấu (link tới trang giải). */
export default function AchievementTable({ items, title }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <h2 className="wiki-section-title">{title}</h2>
      <table className="wiki-table">
        <thead>
          <tr>
            <th>Năm</th>
            <th>Thứ hạng</th>
            <th>Giải đấu</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a, i) => (
            <tr key={i}>
              <td>{a.year || '—'}</td>
              <td>
                <strong>{a.placement || '—'}</strong>
              </td>
              <td>
                {a.tournamentSlug ? (
                  <Link href={`/giai-dau/${a.tournamentSlug}`} className="wiki-link">
                    {a.tournament || '—'}
                  </Link>
                ) : (
                  a.tournament || '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
