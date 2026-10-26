import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleShell, ArticleLayout } from '@/components/ArticleShell';
import { Infobox } from '@/components/Infobox';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WikiTable } from '@/components/WikiTable';
import RichText from '@/components/RichText';
import Mentions from '@/components/Mentions';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { TOURNAMENT_ACCENT } from '@/components/TournamentCard';
import { getPlayers, getTeams, getTournamentBySlug } from '@/lib/store';
import { stripMarkdown } from '@/lib/params';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug((await params).slug);
  if (!tournament) return { title: 'Không tìm thấy' };
  return {
    title: tournament.name,
    description: stripMarkdown(tournament.description) || undefined,
    alternates: { canonical: `/giai-dau/${tournament.slug}` },
    openGraph: {
      title: `${tournament.name} — Lwkypedia`,
      description: stripMarkdown(tournament.description),
      type: 'website',
      url: `/giai-dau/${tournament.slug}`,
    },
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const tournament = await getTournamentBySlug((await params).slug);
  if (!tournament) notFound();
  const teams = await getTeams();
  const players = await getPlayers();

  const resultRows = tournament.results.map((result, index) => ({
    key: `r-${index}`,
    cells: {
      index: <span className="num">{index + 1}</span>,
      result: <Mentions text={result} teams={teams} players={players} />,
    },
  }));

  const rows: [string, React.ReactNode][] = [
    ...(tournament.organizer ? [['Ban tổ chức', tournament.organizer] as [string, React.ReactNode]] : []),
    ...(tournament.frequency ? [['Tần suất', tournament.frequency] as [string, React.ReactNode]] : []),
    ...(tournament.location ? [['Khu vực', tournament.location] as [string, React.ReactNode]] : []),
    ['Số mùa ghi nhận', String(tournament.results.length)],
  ];

  const base = SITE_URL.replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    sport: 'Esports',
    description: stripMarkdown(tournament.description, 300),
    url: `${base}/giai-dau/${tournament.slug}`,
    ...(tournament.organizer ? { organizer: { '@type': 'Organization', name: tournament.organizer } } : {}),
    ...(tournament.location ? { location: { '@type': 'Place', name: tournament.location } } : {}),
  };

  return (
    <ArticleShell
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giải đấu', href: '/giai-dau' },
            { label: tournament.name },
          ]}
        />
      }
      title={tournament.name}
      subtitle={[tournament.organizer, tournament.frequency].filter(Boolean).join(' • ')}
    >
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd(base, [
          { name: 'Trang chủ', path: '/' },
          { name: 'Giải đấu', path: '/giai-dau' },
          { name: tournament.name, path: `/giai-dau/${tournament.slug}` },
        ])}
      />
      <ArticleLayout
        infobox={
          <Infobox
            title={tournament.name}
            subtitle={tournament.frequency}
            initial={tournament.name}
            accent={TOURNAMENT_ACCENT}
            rows={rows}
          />
        }
      >
        <h2 className="wiki-h2">Giới thiệu</h2>
        <RichText className="text-pre wiki-paragraph" text={tournament.description || 'Chưa có thông tin.'} />

        <h2 className="wiki-h2">Lịch sử vô địch</h2>
        <WikiTable
          columns={[
            { key: 'index', label: '#', width: '56px', className: 'num' },
            { key: 'result', label: 'Kết quả' },
          ]}
          rows={resultRows}
          emptyText="Chưa có thông tin."
        />
      </ArticleLayout>
    </ArticleShell>
  );
}
