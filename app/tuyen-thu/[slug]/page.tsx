import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RoleBadge } from '@/components/PlayerCard';
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

function Infobox({
  player,
  teamName,
  teamSlug,
}: {
  player: NonNullable<Awaited<ReturnType<typeof getPlayerBySlug>>>;
  teamName?: string;
  teamSlug?: string | null;
}) {
  const rows: [string, React.ReactNode][] = [
    ['Tên thi đấu', <strong key="ign">{player.ign}</strong>],
    ...(player.realName ? [['Tên thật', player.realName] as [string, React.ReactNode]] : []),
    ['Vị trí', <RoleBadge key="role" role={player.role} />],
    [
      'Đội hiện tại',
      teamSlug && teamName ? (
        <Link key="team" href={`/doi-tuyen/${teamSlug}`} className="text-wiki-blue hover:underline font-medium">
          {teamName}
        </Link>
      ) : (
        <span key="team" className="text-gray-500">Tự do / đã giải nghệ</span>
      ),
    ],
    ['Quốc tịch', player.nationality],
    ...(player.birthYear ? [['Năm sinh', String(player.birthYear)] as [string, React.ReactNode]] : []),
  ];
  return (
    <aside className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-wiki-navy text-white px-4 py-3 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-wiki-gold text-wiki-navy flex items-center justify-center font-extrabold text-2xl">
          {player.ign.charAt(0).toUpperCase()}
        </div>
        <h2 className="font-extrabold text-lg mt-2">{player.ign}</h2>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-gray-100">
              <th className="text-left font-semibold text-gray-600 px-4 py-2 align-top w-28">{k}</th>
              <td className="px-4 py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

export default async function PlayerDetailPage({ params }: { params: { slug: string } }) {
  const player = await getPlayerBySlug(params.slug);
  if (!player) notFound();

  const team = player.teamSlug ? await getTeamBySlug(player.teamSlug) : null;

  return (
    <article>
      <nav className="text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:underline">Trang chủ</Link>
        {' / '}
        <Link href="/tuyen-thu" className="hover:underline">Tuyển thủ</Link>
        {' / '}
        <span className="text-gray-700">{player.ign}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-wiki-darkblue mb-4">{player.ign}</h1>

      {/* Mobile: infobox trước; Desktop: infobox cột phải */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="lg:hidden mb-6">
          <Infobox player={player} teamName={team?.name} teamSlug={team?.slug} />
        </div>

        <div className="wiki-article min-w-0">
          <h2>Tiểu sử</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{player.biography || 'Chưa có thông tin.'}</p>

          <h2>Sự nghiệp</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{player.careerHistory || 'Chưa có thông tin.'}</p>

          <h2>Thành tích</h2>
          {player.achievements.length > 0 ? (
            <ul className="achievements text-gray-800">
              {player.achievements.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có thông tin.</p>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20">
            <Infobox player={player} teamName={team?.name} teamSlug={team?.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}
