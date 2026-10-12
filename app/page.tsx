import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PlayerCard from '@/components/PlayerCard';
import TeamCard from '@/components/TeamCard';
import { getPlayers, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

const FEATURED_PLAYERS = ['lai-bang', 'maris', 'xb'];
const FEATURED_TEAMS = ['saigon-phantom', 'team-flash', 'v-gaming'];

export default async function HomePage() {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);

  const featuredPlayers = FEATURED_PLAYERS.map((s) => players.find((p) => p.slug === s)).filter(
    (p): p is NonNullable<typeof p> => !!p
  );
  const featuredTeams = FEATURED_TEAMS.map((s) => teams.find((t) => t.slug === s)).filter(
    (t): t is NonNullable<typeof t> => !!t
  );
  const teamBySlug = new Map(teams.map((t) => [t.slug, t.name]));
  const recent = [...players, ...teams]
    .map((x) => ({
      updatedAt: x.updatedAt,
      href: 'ign' in x ? `/tuyen-thu/${x.slug}` : `/doi-tuyen/${x.slug}`,
      label: 'ign' in x ? x.ign : x.name,
      kind: 'ign' in x ? 'Tuyển thủ' : 'Đội tuyển',
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <section className="bg-wiki-navy text-white rounded-xl px-6 py-10 md:py-14 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Lowkey<span className="text-wiki-gold">pedia</span>
        </h1>
        <p className="mt-3 text-white/80 max-w-2xl mx-auto text-sm md:text-base">
          Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam — tiểu sử tuyển thủ, đội tuyển,
          sự nghiệp và những danh hiệu huyền thoại.
        </p>
        <div className="mt-6 max-w-xl mx-auto">
          <SearchBar large placeholder="Tìm tuyển thủ, đội tuyển... (VD: Lai Bâng, SGP)" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div>
            <span className="text-2xl font-extrabold text-wiki-gold">{players.length}</span>
            <span className="text-white/70 ml-1">tuyển thủ</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="text-2xl font-extrabold text-wiki-gold">{teams.length}</span>
            <span className="text-white/70 ml-1">đội tuyển</span>
          </div>
        </div>
      </section>

      {/* Tuyển thủ nổi bật */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-wiki-darkblue">Tuyển thủ nổi bật</h2>
          <Link href="/tuyen-thu" className="text-sm text-wiki-blue hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredPlayers.map((p) => (
            <PlayerCard key={p.id} player={p} teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) : 'Tự do'} />
          ))}
        </div>
      </section>

      {/* Đội tuyển */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-wiki-darkblue">Đội tuyển</h2>
          <Link href="/doi-tuyen" className="text-sm text-wiki-blue hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTeams.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              playerCount={players.filter((p) => p.teamSlug === t.slug).length}
            />
          ))}
        </div>
      </section>

      {/* Cập nhật gần đây */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-wiki-darkblue mb-4">Cập nhật gần đây</h2>
        <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {recent.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="font-medium text-wiki-darkblue">{r.label}</span>
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{r.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
