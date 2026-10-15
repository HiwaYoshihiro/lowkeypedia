import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge } from '@/components/Badges';
import AchievementTable from '@/components/AchievementTable';
import { ArticleShell, ArticleLayout } from '@/components/ArticleShell';
import { Infobox } from '@/components/Infobox';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WikiTable } from '@/components/WikiTable';
import RichText from '@/components/RichText';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { TEAM_ACCENT } from '@/components/TeamCard';
import { getPlayersByTeam, getTeamBySlug } from '@/lib/store';
import { stripMarkdown } from '@/lib/params';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const team = await getTeamBySlug(params.slug);
  if (!team) return { title: 'Không tìm thấy' };
  return {
    title: team.name,
    description: stripMarkdown(team.description) || undefined,
    alternates: { canonical: `/doi-tuyen/${team.slug}` },
    openGraph: {
      title: `${team.name} — Lwkypedia`,
      description: stripMarkdown(team.description),
      type: 'website',
      url: `/doi-tuyen/${team.slug}`,
    },
  };
}

export default async function TeamDetailPage({ params }: { params: { slug: string } }) {
  const team = await getTeamBySlug(params.slug);
  if (!team) notFound();
  const roster = await getPlayersByTeam(team.slug);

  const rosterRows = roster.map((p) => ({
    key: p.id,
    cells: {
      ign: (
        <Link href={`/tuyen-thu/${p.slug}`} className="link-button is-strong">
          {p.ign}
        </Link>
      ),
      realName: p.realName ?? '—',
      role: <RoleBadge role={p.role} />,
    },
  }));

  const rows: [string, React.ReactNode][] = [
    ['Tag', <strong key="t">{team.tag}</strong>],
    ['Khu vực', team.region],
    ...(team.founded ? [['Thành lập', String(team.founded)] as [string, React.ReactNode]] : []),
    ['Đội hình', `${roster.length} tuyển thủ`],
  ];

  const base = SITE_URL.replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    alternateName: team.tag,
    sport: 'Esports',
    description: stripMarkdown(team.description, 300),
    url: `${base}/doi-tuyen/${team.slug}`,
    ...(team.founded ? { foundingDate: String(team.founded) } : {}),
    athlete: roster.map((p) => ({ '@type': 'Person', name: p.ign })),
  };

  return (
    <ArticleShell
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đội tuyển', href: '/doi-tuyen' },
            { label: team.name },
          ]}
        />
      }
      title={
        <>
          {team.name}
          {team.tag ? <span className="badge badge-active">{team.tag}</span> : null}
        </>
      }
      subtitle={[team.region, team.founded ? `Thành lập ${team.founded}` : ''].filter(Boolean).join(' • ')}
    >
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd(base, [
          { name: 'Trang chủ', path: '/' },
          { name: 'Đội tuyển', path: '/doi-tuyen' },
          { name: team.name, path: `/doi-tuyen/${team.slug}` },
        ])}
      />
      <ArticleLayout
        infobox={
          <Infobox
            title={team.name}
            subtitle={team.tag}
            initial={team.tag || team.name}
            imageUrl={team.logoUrl}
            accent={TEAM_ACCENT}
            rows={rows}
          />
        }
      >
        <h2 className="wiki-h2">Giới thiệu</h2>
        <RichText className="text-pre wiki-paragraph" text={team.description || 'Chưa có thông tin.'} />

        <h2 className="wiki-h2">Đội hình hiện tại</h2>
        {roster.length > 0 ? (
          <WikiTable
            columns={[
              { key: 'ign', label: 'Tên thi đấu' },
              { key: 'realName', label: 'Tên thật' },
              { key: 'role', label: 'Vị trí', width: '180px' },
            ]}
            rows={rosterRows}
            emptyText="Chưa có dữ liệu đội hình"
          />
        ) : (
          <p className="card-subtitle">Chưa có dữ liệu đội hình.</p>
        )}

        {team.achievements.length > 0 ? (
          <AchievementTable items={team.achievements} title="Thành tích đội tuyển" />
        ) : (
          <>
            <h2 className="wiki-h2">Thành tích đội tuyển</h2>
            <p className="card-subtitle">Chưa có thông tin.</p>
          </>
        )}
      </ArticleLayout>
    </ArticleShell>
  );
}
