import Link from 'next/link';
import type { Metadata } from 'next';
import PlayerCard, { PLAYER_ACCENT } from '@/components/PlayerCard';
import { ArticleShell } from '@/components/ArticleShell';
import { ROLES } from '@/lib/types';
import { getPlayers, getTeams } from '@/lib/store';
import { firstParam } from '@/lib/params';
import { normalizeSearch } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tuyển thủ',
  description:
    'Danh sách tuyển thủ Liên Quân Mobile Việt Nam: tên thi đấu, tên thật, vị trí và đội tuyển hiện tại.',
  alternates: { canonical: '/tuyen-thu' },
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; team?: string | string[]; role?: string | string[] }>;
}) {
  const sp = await searchParams;
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  const teamBySlug = new Map(teams.map((t) => [t.slug, t.name]));

  const q = firstParam(sp.q).trim();
  const teamFilter = firstParam(sp.team);
  const roleFilter = firstParam(sp.role);

  let filtered = players;
  if (q) {
    // Khớp cả tên thi đấu, tên thật và vị trí — nhưng tính trực tiếp trên danh sách
    // đã có, không gọi searchAll (vốn đọc lại cả 3 file).
    const nq = normalizeSearch(q);
    filtered = filtered.filter((p) =>
      normalizeSearch([p.ign, p.realName ?? '', p.role].join(' ')).includes(nq)
    );
  }
  if (teamFilter === '__none') filtered = filtered.filter((p) => !p.teamSlug);
  else if (teamFilter) filtered = filtered.filter((p) => p.teamSlug === teamFilter);
  if (roleFilter) filtered = filtered.filter((p) => p.role === roleFilter);

  const hasFilter = Boolean(q || teamFilter || roleFilter);

  return (
    <ArticleShell
      title={
        <>
          <span aria-hidden="true">🎮</span> Tuyển thủ
        </>
      }
      subtitle={`Tuyển thủ Liên Quân Mobile Việt Nam trong cơ sở dữ liệu (${players.length})`}
    >
      <form method="GET" className="toolbar">
        <div className="toolbar-grow">
          <input
            type="search"
            name="q"
            className="input toolbar-search"
            defaultValue={q}
            placeholder="Tìm theo tên thi đấu, tên thật…"
            aria-label="Tìm tuyển thủ"
          />
        </div>
        <select name="team" className="input toolbar-field" defaultValue={teamFilter} aria-label="Lọc theo đội">
          <option value="">Tất cả đội</option>
          {teams.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
          <option value="__none">Tự do / đã giải nghệ</option>
        </select>
        <select name="role" className="input toolbar-field" defaultValue={roleFilter} aria-label="Lọc theo vị trí">
          <option value="">Mọi vị trí</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Lọc
        </button>
        {hasFilter ? (
          <Link href="/tuyen-thu" className="btn btn-ghost">
            Xoá lọc
          </Link>
        ) : null}
        <span className="result-count">
          {filtered.length}/{players.length}
        </span>
      </form>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            🔍
          </div>
          <div className="empty-state-title">Không tìm thấy tuyển thủ nào</div>
          <p className="empty-state-text">
            Không có tuyển thủ nào khớp bộ lọc hiện tại. Thử bỏ bớt điều kiện lọc.
          </p>
        </div>
      ) : (
        <div className="card-grid" style={{ '--card-accent': PLAYER_ACCENT } as React.CSSProperties}>
          {filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) : undefined}
            />
          ))}
        </div>
      )}
    </ArticleShell>
  );
}
