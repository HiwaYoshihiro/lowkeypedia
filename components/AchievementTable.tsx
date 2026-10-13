import Link from 'next/link';
import type { Achievement } from '@/lib/types';
import { WikiTable } from './WikiTable';

/**
 * Bảng thành tích kiểu Liquipedia: Năm | Thứ hạng | Giải đấu (link tới trang giải).
 */
export default function AchievementTable({ items, title }: { items: Achievement[]; title: string }) {
  if (!items || items.length === 0) return null;

  const rows = items.map((a, index) => ({
    key: `a-${index}`,
    cells: {
      year: <span className="num">{a.year || '—'}</span>,
      placement: <strong>{a.placement || '—'}</strong>,
      tournament: a.tournamentSlug ? (
        <Link href={`/giai-dau/${a.tournamentSlug}`} className="link-button">
          {a.tournament || '—'}
        </Link>
      ) : (
        a.tournament || '—'
      ),
    },
  }));

  return (
    <>
      <h2 className="wiki-h2">{title}</h2>
      <WikiTable
        columns={[
          { key: 'year', label: 'Năm', width: '90px' },
          { key: 'placement', label: 'Thứ hạng', width: '34%' },
          { key: 'tournament', label: 'Giải đấu' },
        ]}
        rows={rows}
      />
    </>
  );
}
