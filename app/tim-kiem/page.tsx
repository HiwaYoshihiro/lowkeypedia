import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { searchAll } from '@/lib/store';

export const dynamic = 'force-dynamic';

const KIND_HREF: Record<string, (slug: string) => string> = {
  player: (s) => `/tuyen-thu/${s}`,
  team: (s) => `/doi-tuyen/${s}`,
  tournament: (s) => `/giai-dau/${s}`,
};

const KIND_LABEL: Record<string, string> = {
  player: 'Tuyển thủ',
  team: 'Đội tuyển',
  tournament: 'Giải đấu',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const results = q ? await searchAll(q) : [];
  const players = results.filter((r) => r.type === 'player');
  const teams = results.filter((r) => r.type === 'team');
  const tournaments = results.filter((r) => r.type === 'tournament');

  return (
    <div>
      <h1 className="wiki-title">Tìm kiếm</h1>
      <div style={{ marginTop: '12px', maxWidth: '560px' }}>
        <SearchBar defaultValue={q} placeholder="Tìm tuyển thủ, đội tuyển, giải đấu..." />
      </div>

      {!q ? (
        <p style={{ marginTop: '24px', color: '#72777d', fontSize: '14px' }}>
          Nhập từ khoá để tìm tuyển thủ, đội tuyển hoặc giải đấu (không phân biệt dấu).
        </p>
      ) : results.length === 0 ? (
        <p style={{ marginTop: '24px', color: '#72777d' }}>
          Không tìm thấy kết quả nào cho “<strong>{q}</strong>”.
        </p>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '14px', color: '#72777d', marginBottom: '8px' }}>
            Tìm thấy {results.length} kết quả cho “<strong>{q}</strong>”
          </p>

          {[
            ['Tuyển thủ', players],
            ['Đội tuyển', teams],
            ['Giải đấu', tournaments],
          ].map(([label, list]) =>
            (list as typeof results).length > 0 ? (
              <section key={label as string} style={{ marginBottom: '20px' }}>
                <h2 className="wiki-section-title">
                  {label as string} ({(list as typeof results).length})
                </h2>
                <ul className="wiki-result-list">
                  {(list as typeof results).map((r) => (
                    <li key={`${r.type}-${r.slug}`}>
                      <Link href={KIND_HREF[r.type](r.slug)}>
                        <span className="wiki-result-title">{r.title}</span>{' '}
                        <span className="status-badge badge-inactive" style={{ marginLeft: '6px' }}>
                          {KIND_LABEL[r.type]}
                        </span>
                        <div className="wiki-result-sub">{r.subtitle}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
