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
      <h1 className="text-2xl md:text-3xl font-extrabold text-wiki-darkblue">Tuyển thủ</h1>
      <p className="text-gray-600 mt-1 text-sm">Danh sách tuyển thủ Liên Quân Mobile Việt Nam ({filtered.length})</p>

      <form method="GET" className="mt-4 bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên thi đấu..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wiki-blue"
        />
        <select
          name="team"
          defaultValue={teamFilter}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tất cả đội</option>
          {teams.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
          <option value="__none">Tự do / đã giải nghệ</option>
        </select>
        <select
          name="role"
          defaultValue={roleFilter}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Mọi vị trí</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-wiki-blue hover:bg-wiki-darkblue text-white text-sm font-semibold px-5 py-2 rounded-lg">
          Lọc
        </button>
      </form>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Không tìm thấy tuyển thủ nào phù hợp.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) ?? 'Tự do' : 'Tự do'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
