import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge, TeamStatusBadge } from '@/components/Badges';
import AchievementTable from '@/components/AchievementTable';
import { ArticleShell, ArticleLayout } from '@/components/ArticleShell';
import { Infobox } from '@/components/Infobox';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WikiTable } from '@/components/WikiTable';
import { PLAYER_ACCENT } from '@/components/PlayerCard';
import { getPlayerBySlug, getTeamBySlug, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const player = await getPlayerBySlug(params.slug);
  return {
    title: player ? `${player.ign} — Lowkeypedia` : 'Không tìm thấy — Lowkeypedia',
    description: player?.biography.slice(0, 160),
  };
}

export default async function PlayerDetailPage({ params }: { params: { slug: string } }) {
  const player = await getPlayerBySlug(params.slug);
  if (!player) notFound();

  const team = player.teamSlug ? await getTeamBySlug(player.teamSlug) : null;
  const teams = await getTeams();
  const teamNameOf = (slug?: string) => teams.find((t) => t.slug === slug)?.name ?? null;

  const teamHistory = player.teamHistory ?? [];

  const historyRows = teamHistory.map((h, i) => ({
    key: `h-${i}`,
    cells: {
      period: <strong>{h.period || '—'}</strong>,
      team: h.teamSlug ? (
        <Link href={`/doi-tuyen/${h.teamSlug}`} className="link-button">
          {teamNameOf(h.teamSlug) ?? h.team}
        </Link>
      ) : (
        <strong>{h.team || '—'}</strong>
      ),
    },
  }));

  const rows: [string, React.ReactNode][] = [
    ...(player.realName ? [['Tên thật', player.realName] as [string, React.ReactNode]] : []),
    ['Vị trí', <RoleBadge key="role" role={player.role} />],
    [
      'Đội hiện tại',
      team ? (
        <Link key="team" href={`/doi-tuyen/${team.slug}`} className="link-button">
          {team.name}
        </Link>
      ) : (
        <TeamStatusBadge key="team" />
      ),
    ],
    ['Quốc tịch', player.nationality],
    ...(player.birthYear ? [['Năm sinh', String(player.birthYear)] as [string, React.ReactNode]] : []),
  ];

  return (
    <ArticleShell
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tuyển thủ', href: '/tuyen-thu' },
            { label: player.ign },
          ]}
        />
      }
      title={
        <>
          {player.ign}
          <TeamStatusBadge teamName={team?.name} />
        </>
      }
      subtitle={[player.realName, player.role].filter(Boolean).join(' • ')}
    >
      <ArticleLayout
        infobox={
          <Infobox
            title={player.ign}
            subtitle={player.realName}
            initial={player.ign}
            imageUrl={player.avatarUrl}
            accent={PLAYER_ACCENT}
            rows={rows}
          />
        }
      >
        <h2 className="wiki-h2">Tiểu sử</h2>
        <p className="text-pre wiki-paragraph">{player.biography || 'Chưa có thông tin.'}</p>

        <h2 className="wiki-h2">Sự nghiệp</h2>
        <p className="text-pre wiki-paragraph">{player.careerHistory || 'Chưa có thông tin.'}</p>

        {teamHistory.length > 0 ? (
          <>
            <h2 className="wiki-h2">Lịch sử đội tuyển</h2>
            <WikiTable
              columns={[
                { key: 'period', label: 'Giai đoạn', width: '40%' },
                { key: 'team', label: 'Đội tuyển' },
              ]}
              rows={historyRows}
            />
          </>
        ) : null}

        {player.achievements.length > 0 ? (
          <AchievementTable items={player.achievements} title="Thành tích thi đấu" />
        ) : (
          <>
            <h2 className="wiki-h2">Thành tích thi đấu</h2>
            <p className="card-subtitle">Chưa có thông tin.</p>
          </>
        )}
      </ArticleLayout>
    </ArticleShell>
  );
}
