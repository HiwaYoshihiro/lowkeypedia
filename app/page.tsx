import Link from 'next/link';
import PlayerCard, { PLAYER_ACCENT } from '@/components/PlayerCard';
import TeamCard, { TEAM_ACCENT } from '@/components/TeamCard';
import TournamentCard, { TOURNAMENT_ACCENT } from '@/components/TournamentCard';
import { KindBadge } from '@/components/Badges';
import { SectionBlock } from '@/components/SectionBlock';
import { getPlayers, getTeams, getTournaments } from '@/lib/store';
import { SITE_NAME_HEAD, SITE_NAME_TAIL } from '@/lib/site';

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
      kind: 'ign' in x ? 'player' : 'tag' in x ? 'team' : 'tournament',
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Chào mừng đến với {SITE_NAME_HEAD}
            <span className="brand-gold">{SITE_NAME_TAIL}</span>
          </h1>
          <p className="hero-lead">
            Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam — tra cứu tiểu sử tuyển thủ,
            đội tuyển, giải đấu, sự nghiệp và những danh hiệu huyền thoại theo phong cách wiki.
          </p>
          <div className="hero-actions">
            <Link href="/tuyen-thu" className="btn">
              🎮 Xem tuyển thủ
            </Link>
            <Link href="/giai-dau" className="btn">
              🏆 Xem giải đấu
            </Link>
            <Link href="/tim-kiem" className="btn">
              🔍 Tìm kiếm
            </Link>
          </div>
        </div>
      </section>

      <div className="stat-row">
        {[
          { href: '/tuyen-thu', value: players.length, label: 'Tuyển thủ', icon: '🎮', accent: PLAYER_ACCENT },
          { href: '/doi-tuyen', value: teams.length, label: 'Đội tuyển', icon: '🛡️', accent: TEAM_ACCENT },
          { href: '/giai-dau', value: tournaments.length, label: 'Giải đấu', icon: '🏆', accent: TOURNAMENT_ACCENT },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="stat-card"
            style={{ '--stat-accent': item.accent } as React.CSSProperties}
          >
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">
              {item.icon} {item.label}
            </div>
          </Link>
        ))}
      </div>

      <SectionBlock
        title="🎮 Tuyển thủ nổi bật"
        href="/tuyen-thu"
        accent={PLAYER_ACCENT}
        count={players.length}
      >
        <div className="card-grid">
          {featuredPlayers.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              teamName={p.teamSlug ? teamBySlug.get(p.teamSlug) : undefined}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="🛡️ Đội tuyển" href="/doi-tuyen" accent={TEAM_ACCENT} count={teams.length}>
        <div className="card-grid">
          {featuredTeams.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              playerCount={players.filter((p) => p.teamSlug === t.slug).length}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="🏆 Giải đấu"
        href="/giai-dau"
        accent={TOURNAMENT_ACCENT}
        count={tournaments.length}
      >
        <div className="card-grid">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </SectionBlock>

      <section className="section-block" style={{ '--section-accent': '#8430ce' } as React.CSSProperties}>
        <div className="section-block-head">
          <h2 className="section-block-title">Cập nhật gần đây</h2>
        </div>
        <ul className="update-list">
          {recent.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="link-button is-strong">
                {r.label}
              </Link>
              <KindBadge kind={r.kind} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
