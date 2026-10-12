import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge } from '@/components/PlayerCard';
import AchievementTable from '@/components/AchievementTable';
import { getPlayersByTeam, getTeamBySlug } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const team = await getTeamBySlug(params.slug);
  return {
    title: team ? `${team.name} — Lowkeypedia` : 'Không tìm thấy — Lowkeypedia',
    description: team?.description.slice(0, 160),
  };
}

export default async function TeamDetailPage({ params }: { params: { slug: string } }) {
  const team = await getTeamBySlug(params.slug);
  if (!team) notFound();
  const roster = await getPlayersByTeam(team.slug);

  const rows: [string, React.ReactNode][] = [
    ['Tên đội', <strong key="n">{team.name}</strong>],
    ['Tag', <span key="t" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{team.tag}</span>],
    ['Khu vực', team.region],
    ...(team.founded ? [['Thành lập', String(team.founded)] as [string, React.ReactNode]] : []),
  ];

  return (
    <article>
      <nav className="wiki-breadcrumb">
        <Link href="/" className="wiki-link">Trang chủ</Link>
        {' / '}
        <Link href="/doi-tuyen" className="wiki-link">Đội tuyển</Link>
        {' / '}
        <span>{team.name}</span>
      </nav>

      <main className="wiki-content">
        <div className="main-column">
          <h1 className="wiki-title">
            {team.name} <span style={{ fontSize: '18px', color: '#72777d' }}>({team.tag})</span>
          </h1>

          <div className="wiki-article">
            <h2 className="wiki-section-title">Giới thiệu</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{team.description || 'Chưa có thông tin.'}</p>

            <h2 className="wiki-section-title">Đội hình hiện tại</h2>
            {roster.length > 0 ? (
              <table className="wiki-table">
                <thead>
                  <tr>
                    <th>Tên thi đấu</th>
                    <th>Tên thật</th>
                    <th>Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/tuyen-thu/${p.slug}`} className="wiki-link">
                          <strong>{p.ign}</strong>
                        </Link>
                      </td>
                      <td>{p.realName ?? '—'}</td>
                      <td><RoleBadge role={p.role} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#72777d' }}>Chưa có dữ liệu đội hình.</p>
            )}

            {team.achievements.length > 0 ? (
              <AchievementTable items={team.achievements} title="Thành tích đội tuyển" />
            ) : (
              <>
                <h2 className="wiki-section-title">Thành tích đội tuyển</h2>
                <p style={{ color: '#72777d' }}>Chưa có thông tin.</p>
              </>
            )}
          </div>
        </div>

        <aside className="infobox">
          <div className="infobox-header infobox-green">{team.name}</div>
          <div className="infobox-avatar infobox-avatar-green">{team.tag.charAt(0).toUpperCase()}</div>
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
