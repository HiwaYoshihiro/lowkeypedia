import type { Metadata } from 'next';
import TeamCard, { TEAM_ACCENT } from '@/components/TeamCard';
import { ArticleShell } from '@/components/ArticleShell';
import { getPlayers, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Đội tuyển',
  description:
    'Các đội tuyển Liên Quân Mobile Việt Nam: tag, khu vực, năm thành lập, đội hình và thành tích.',
  alternates: { canonical: '/doi-tuyen' },
};

export default async function TeamsPage() {
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);

  // Đếm đội hình một lần thay vì lọc lại toàn bộ danh sách cho từng đội.
  const rosterCount = new Map<string, number>();
  for (const p of players) {
    if (p.teamSlug) rosterCount.set(p.teamSlug, (rosterCount.get(p.teamSlug) ?? 0) + 1);
  }

  return (
    <ArticleShell
      title={
        <>
          <span aria-hidden="true">🛡️</span> Đội tuyển
        </>
      }
      subtitle={`Các đội tuyển Liên Quân Mobile Việt Nam thi đấu tại Đấu Trường Danh Vọng (${teams.length})`}
    >
      {teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            🛡️
          </div>
          <div className="empty-state-title">Chưa có đội tuyển nào</div>
          <p className="empty-state-text">Dữ liệu sẽ xuất hiện sau khi quản trị viên thêm vào.</p>
        </div>
      ) : (
        <div className="card-grid" style={{ '--card-accent': TEAM_ACCENT } as React.CSSProperties}>
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} playerCount={rosterCount.get(t.slug) ?? 0} />
          ))}
        </div>
      )}
    </ArticleShell>
  );
}
