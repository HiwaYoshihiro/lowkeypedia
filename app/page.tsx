import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PlayerCard from '@/components/PlayerCard';
import TeamCard from '@/components/TeamCard';
import TournamentCard from '@/components/TournamentCard';
import { getPlayers, getTeams, getTournaments } from '@/lib/store';

export const dynamic = 'force-dynamic';

const FEATURED_PLAYERS = ['lai-bang', 'maris', 'xb', 'quang-hai', 'adc', 'proe', 'bronzev', 'elly'];
const FEATURED_TEAMS = ['saigon-phantom', 'team-flash', 'v-gaming', 'fap-esports'];

export default async function HomePage() {
  const [players, teams, tournaments] = await Promise.all([
    getPlayers(),
    getTeams(),
    getTournaments(),
  ]);

  const featuredPlayers = FEATURED_PLAYERS.map((s) => players.find((p) => p.slug === s)).filter(
    (p): p is NonNullable<typeof p> => !!p
  );
  const featuredTeams = FEATURED_TEAMS.map((s) => teams.find((t) => t.slug === s)).filter(
    (t): t is NonNullable<typeof t> => !!t
  );
  const teamBySlug = new Map(teams.map((t) => [t.slug, t.name]));
  const recent = [...players, ...teams, ...tournaments]
    .map((x) => ({
      updatedAt: x.updatedAt,
      href:
        'ign' in x
          ? `/tuyen-thu/${x.slug}`
          : 'tag' in x
            ? `/doi-tuyen/${x.slug}`
            : `/giai-dau/${x.slug}`,
      label: 'ign' in x ? x.ign : x.name,
      kind: 'ign' in x ? 'Tuyển thủ' : 'tag' in x ? 'Đội tuyển' : 'Giải đấu',
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <div className="home-hero">
        <h2>Chào mừng đến với Lowkeypedia</h2>
        <p>
          <strong>Lowkeypedia</strong> là bách khoa toàn thư mở về Liên Quân Mobile Việt Nam —
          tra cứu tiểu sử tuyển thủ, đội tuyển, giải đấu, sự nghiệp và những danh hiệu huyền thoại
          theo phong cách wiki.
        </p>
        <SearchBar large placeholder="Tìm tuyển thủ, đội tuyển, giải đấu... (VD: Lai Bâng, SGP, AIC)" />
        <div className="home-stats">
          <div>
            <strong>{players.length}</strong> <span>tuyển thủ</span>
          </div>
          <div>
            <strong>{teams.length}</strong> <span>đội tuyển</span>
          </div>
          <div>
            <strong>{tournaments.length}</strong> <span>giải đấu</span>
          </div>
        </div>
      </div>

      {/* Tuyển thủ nổi bật */}
      <section style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="wiki-section-title" style={{ marginTop: 0, flex: 1 }}>
            Tuyển thủ nổi bật
          </h3>
          <Link href="/tuyen-thu" className="wiki-link" style={{ fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
            Xem tất cả →
          </Link>
        </div>
        <div className="catalogue-grid">
          {featuredPlayers.map((p) => (
            <PlayerCard key={p.id} player={p} teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) : undefined} />
          ))}
        </div>
      </section>

      {/* Đội tuyển */}
      <section style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="wiki-section-title" style={{ marginTop: 0, flex: 1 }}>
            Đội tuyển
          </h3>
          <Link href="/doi-tuyen" className="wiki-link" style={{ fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
            Xem tất cả →
          </Link>
        </div>
        <div className="catalogue-grid">
          {featuredTeams.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              playerCount={players.filter((p) => p.teamSlug === t.slug).length}
            />
          ))}
        </div>
      </section>

      {/* Giải đấu */}
      <section style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="wiki-section-title" style={{ marginTop: 0, flex: 1 }}>
            Giải đấu
          </h3>
          <Link href="/giai-dau" className="wiki-link" style={{ fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
            Xem tất cả →
          </Link>
        </div>
        <div className="catalogue-grid">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      {/* Cập nhật gần đây */}
      <section style={{ marginTop: '28px' }}>
        <h3 className="wiki-section-title" style={{ marginTop: 0 }}>
          Cập nhật gần đây
        </h3>
        <ul className="wiki-result-list">
          {recent.map((r) => (
            <li key={r.href}>
              <Link href={r.href}>
                <span className="wiki-result-title">{r.label}</span>{' '}
                <span className="status-badge badge-inactive" style={{ marginLeft: '6px' }}>{r.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
