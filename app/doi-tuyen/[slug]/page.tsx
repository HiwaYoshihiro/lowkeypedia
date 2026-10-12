import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge } from '@/components/PlayerCard';
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
    ['Tag', <span key="t" className="font-mono font-bold">{team.tag}</span>],
    ['Khu vực', team.region],
    ...(team.founded ? [['Thành lập', String(team.founded)] as [string, React.ReactNode]] : []),
  ];

  return (
    <article>
      <nav className="text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:underline">Trang chủ</Link>
        {' / '}
        <Link href="/doi-tuyen" className="hover:underline">Đội tuyển</Link>
        {' / '}
        <span className="text-gray-700">{team.name}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-wiki-darkblue mb-4">
        {team.name} <span className="text-lg text-gray-500 font-bold">({team.tag})</span>
      </h1>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="lg:hidden mb-6">
          <aside className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-wiki-navy text-white px-4 py-4 text-center">
              <div className="inline-block bg-wiki-gold text-wiki-navy font-extrabold rounded px-3 py-1.5 text-xl">
                {team.tag}
              </div>
              <h2 className="font-extrabold text-lg mt-2">{team.name}</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-gray-100">
                    <th className="text-left font-semibold text-gray-600 px-4 py-2 w-28">{k}</th>
                    <td className="px-4 py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>
        </div>

        <div className="wiki-article min-w-0">
          <h2>Giới thiệu</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{team.description || 'Chưa có thông tin.'}</p>

          <h2>Đội hình hiện tại</h2>
          {roster.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roster.map((p) => (
                <Link
                  key={p.id}
                  href={`/tuyen-thu/${p.slug}`}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-wiki-blue"
                >
                  <div className="w-10 h-10 rounded-full bg-wiki-navy text-wiki-gold flex items-center justify-center font-extrabold shrink-0">
                    {p.ign.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-wiki-darkblue truncate">{p.ign}</p>
                    <RoleBadge role={p.role} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Chưa có dữ liệu đội hình.</p>
          )}

          <h2>Thành tích</h2>
          {team.achievements.length > 0 ? (
            <ul className="achievements text-gray-800">
              {team.achievements.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có thông tin.</p>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20">
            <aside className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-wiki-navy text-white px-4 py-4 text-center">
                <div className="inline-block bg-wiki-gold text-wiki-navy font-extrabold rounded px-3 py-1.5 text-xl">
                  {team.tag}
                </div>
                <h2 className="font-extrabold text-lg mt-2">{team.name}</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k} className="border-t border-gray-100">
                      <th className="text-left font-semibold text-gray-600 px-4 py-2 w-28">{k}</th>
                      <td className="px-4 py-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
