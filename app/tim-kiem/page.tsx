import Link from 'next/link';
import type { Metadata } from 'next';
import { KindBadge } from '@/components/Badges';
import { ArticleShell } from '@/components/ArticleShell';
import { searchAll } from '@/lib/store';
import { firstParam } from '@/lib/params';
import { KIND_HREF } from '@/lib/entities';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tìm kiếm',
  description:
    'Tìm tuyển thủ, đội tuyển hoặc giải đấu Liên Quân Mobile — không phân biệt dấu tiếng Việt.',
  alternates: { canonical: '/tim-kiem' },
  robots: { index: false, follow: true },
};

const GROUPS: [string, 'player' | 'team' | 'tournament'][] = [
  ['Tuyển thủ', 'player'],
  ['Đội tuyển', 'team'],
  ['Giải đấu', 'tournament'],
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  const results = q ? await searchAll(q) : [];

  return (
    <ArticleShell
      title={
        <>
          <span aria-hidden="true">🔍</span> Tìm kiếm
        </>
      }
      subtitle="Tìm tuyển thủ, đội tuyển hoặc giải đấu — không phân biệt dấu"
    >
      <form method="GET" className="toolbar">
        <div className="toolbar-grow">
          <input
            type="search"
            name="q"
            className="input toolbar-search"
            defaultValue={q}
            placeholder="VD: Lai Bâng, SGP, AIC, Saigon Phantom…"
            aria-label="Từ khoá tìm kiếm"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Tìm kiếm
        </button>
        {q ? (
          <Link href="/tim-kiem" className="btn btn-ghost">
            Xoá
          </Link>
        ) : null}
        {q ? <span className="result-count">{results.length} kết quả</span> : null}
      </form>

      {!q ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <div className="empty-state-icon" aria-hidden="true">
            ⌨️
          </div>
          <div className="empty-state-title">Nhập từ khoá để tra cứu</div>
          <p className="empty-state-text">
            Ô tìm kiếm ở đầu trang (<span className="kbd">Ctrl</span>+<span className="kbd">K</span>)
            hiện gợi ý ngay khi bạn gõ. Cách này tìm không dấu nên “lai bang” và “Lai Bâng” đều ra.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <div className="empty-state-icon" aria-hidden="true">
            🔍
          </div>
          <div className="empty-state-title">Không tìm thấy kết quả nào</div>
          <p className="empty-state-text">
            Không có mục nào khớp với “<strong>{q}</strong>”. Thử từ khoá ngắn hơn hoặc kiểm tra
            chính tả.
          </p>
        </div>
      ) : (
        <>
          <p className="card-subtitle" style={{ marginTop: 14 }}>
            Tìm thấy {results.length} kết quả cho “<strong>{q}</strong>”
          </p>

          {GROUPS.map(([label, kind]) => {
            const list = results.filter((r) => r.type === kind);
            if (list.length === 0) return null;
            return (
              <section key={kind}>
                <h2 className="wiki-h2">
                  {label} ({list.length})
                </h2>
                <ul className="result-list">
                  {list.map((r) => (
                    <li key={`${r.type}-${r.slug}`}>
                      <span className="result-title">
                        <Link href={KIND_HREF[r.type](r.slug)} className="link-button is-strong">
                          {r.title}
                        </Link>
                        <KindBadge kind={r.type} />
                      </span>
                      <span className="card-subtitle">{r.subtitle}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </ArticleShell>
  );
}
