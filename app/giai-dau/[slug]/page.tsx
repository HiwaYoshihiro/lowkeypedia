import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleShell, ArticleLayout } from '@/components/ArticleShell';
import { Infobox } from '@/components/Infobox';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WikiTable } from '@/components/WikiTable';
import { TOURNAMENT_ACCENT } from '@/components/TournamentCard';
import { getTournamentBySlug } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  return {
    title: tournament ? `${tournament.name} — Lowkeypedia` : 'Không tìm thấy — Lowkeypedia',
    description: tournament?.description.slice(0, 160),
  };
}

export default async function TournamentDetailPage({ params }: { params: { slug: string } }) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) notFound();

  const resultRows = tournament.results.map((result, index) => ({
    key: `r-${index}`,
    cells: {
      index: <span className="num">{index + 1}</span>,
      result,
    },
  }));

  const rows: [string, React.ReactNode][] = [
    ...(tournament.organizer ? [['Ban tổ chức', tournament.organizer] as [string, React.ReactNode]] : []),
    ...(tournament.frequency ? [['Tần suất', tournament.frequency] as [string, React.ReactNode]] : []),
    ...(tournament.location ? [['Khu vực', tournament.location] as [string, React.ReactNode]] : []),
    ['Số mùa ghi nhận', String(tournament.results.length)],
  ];

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
        <p className="text-pre wiki-paragraph">{tournament.description || 'Chưa có thông tin.'}</p>

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
