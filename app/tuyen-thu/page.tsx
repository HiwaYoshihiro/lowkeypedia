import PlayerCard, { PLAYER_ACCENT } from '@/components/PlayerCard';
import { ArticleShell } from '@/components/ArticleShell';
import { ROLES } from '@/lib/types';
import { getPlayers, getTeams, searchAll } from '@/lib/store';
import { normalizeSearch } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { q?: string; team?: string; role?: string };
}) {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  const teamBySlug = new Map(teams.map((t) => [t.slug, t.name]));

  const q = (searchParams.q ?? '').trim();
  const teamFilter = searchParams.team ?? '';
  const roleFilter = searchParams.role ?? '';

  let filtered = players;
  if (q) {
    const hits = new Set((await searchAll(q)).filter((r) => r.type === 'player').map((r) => r.slug));
    const nq = normalizeSearch(q);
    filtered = filtered.filter((p) => hits.has(p.slug) || normalizeSearch(p.ign).includes(nq));
  }
  if (teamFilter === '__none') filtered = filtered.filter((p) => !p.teamSlug);
  else if (teamFilter) filtered = filtered.filter((p) => p.teamSlug === teamFilter);
  if (roleFilter) filtered = filtered.filter((p) => p.role === roleFilter);

  const hasFilter = Boolean(q || teamFilter || roleFilter);

  return (
    <ArticleShell
      title="🎮 Tuyển thủ"
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
          <a href="/tuyen-thu" className="btn btn-ghost">
            Xoá lọc
          </a>
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
