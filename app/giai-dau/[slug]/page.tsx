import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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

  const rows: [string, React.ReactNode][] = [
    ['Tên giải', <strong key="n">{tournament.name}</strong>],
    ...(tournament.organizer ? [['Ban tổ chức', tournament.organizer] as [string, React.ReactNode]] : []),
    ...(tournament.frequency ? [['Tần suất', tournament.frequency] as [string, React.ReactNode]] : []),
    ...(tournament.location ? [['Khu vực', tournament.location] as [string, React.ReactNode]] : []),
  ];

  return (
    <article>
      <nav className="wiki-breadcrumb">
        <Link href="/" className="wiki-link">Trang chủ</Link>
        {' / '}
        <Link href="/giai-dau" className="wiki-link">Giải đấu</Link>
        {' / '}
        <span>{tournament.name}</span>
      </nav>

      <main className="wiki-content">
        <div className="main-column">
          <h1 className="wiki-title">{tournament.name}</h1>

          <div className="wiki-article">
            <h2 className="wiki-section-title">Giới thiệu</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{tournament.description || 'Chưa có thông tin.'}</p>

            <h2 className="wiki-section-title">Lịch sử vô địch</h2>
            {tournament.results.length > 0 ? (
              <table className="wiki-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>#</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.results.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#72777d' }}>Chưa có thông tin.</p>
            )}
          </div>
        </div>

        <aside className="infobox">
          <div className="infobox-header infobox-red">{tournament.name}</div>
          <div className="infobox-avatar infobox-avatar-red">
            {tournament.name.charAt(0).toUpperCase()}
          </div>
          <table className="infobox-table">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </main>
    </article>
  );
}
