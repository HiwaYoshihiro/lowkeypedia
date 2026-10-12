import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge, TeamStatusBadge } from '@/components/PlayerCard';
import { getPlayerBySlug, getTeamBySlug } from '@/lib/store';

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

  const rows: [string, React.ReactNode][] = [
    ['Tên thi đấu', <strong key="ign">{player.ign}</strong>],
    ...(player.realName ? [['Tên thật', player.realName] as [string, React.ReactNode]] : []),
    ['Vị trí', <RoleBadge key="role" role={player.role} />],
    [
      'Đội hiện tại',
      team ? (
        <Link key="team" href={`/doi-tuyen/${team.slug}`} className="wiki-link">
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
    <article>
      <nav className="wiki-breadcrumb">
        <Link href="/" className="wiki-link">Trang chủ</Link>
        {' / '}
        <Link href="/tuyen-thu" className="wiki-link">Tuyển thủ</Link>
        {' / '}
        <span>{player.ign}</span>
      </nav>

      <main className="wiki-content">
        <div className="main-column">
          <h1 className="wiki-title">{player.ign}</h1>

          <div className="wiki-article">
            <h2 className="wiki-section-title">Tiểu sử</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{player.biography || 'Chưa có thông tin.'}</p>

            <h2 className="wiki-section-title">Sự nghiệp</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{player.careerHistory || 'Chưa có thông tin.'}</p>

            <h2 className="wiki-section-title">Thành tích</h2>
            {player.achievements.length > 0 ? (
              <ul className="achievements">
                {player.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#72777d' }}>Chưa có thông tin.</p>
            )}
          </div>
        </div>

        <aside className="infobox">
          <div className="infobox-header">{player.ign}</div>
          <div className="infobox-avatar">{player.ign.charAt(0).toUpperCase()}</div>
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
