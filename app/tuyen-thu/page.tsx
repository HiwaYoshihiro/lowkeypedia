import PlayerCard from '@/components/PlayerCard';
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

  return (
    <div>
      <h1 className="wiki-title">Tuyển thủ</h1>
      <p style={{ fontSize: '13px', color: '#72777d', marginTop: '6px' }}>
        Danh sách tuyển thủ Liên Quân Mobile Việt Nam ({filtered.length})
      </p>

      <form method="GET" className="wiki-filterbar">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên thi đấu..."
        />
        <select name="team" defaultValue={teamFilter}>
          <option value="">Tất cả đội</option>
          {teams.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
          <option value="__none">Tự do / đã giải nghệ</option>
        </select>
        <select name="role" defaultValue={roleFilter}>
          <option value="">Mọi vị trí</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="wiki-btn">
          Lọc
        </button>
      </form>

      {filtered.length === 0 ? (
        <p style={{ marginTop: '24px', textAlign: 'center', color: '#72777d' }}>
          Không tìm thấy tuyển thủ nào phù hợp.
        </p>
      ) : (
        <div className="catalogue-grid">
          {filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
