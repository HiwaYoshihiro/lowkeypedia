import TeamCard, { TEAM_ACCENT } from '@/components/TeamCard';
import { ArticleShell } from '@/components/ArticleShell';
import { getPlayers, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);

  return (
    <ArticleShell
      title="🛡️ Đội tuyển"
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
            <TeamCard
              key={t.id}
              team={t}
              playerCount={players.filter((p) => p.teamSlug === t.slug).length}
            />
          ))}
        </div>
      )}
    </ArticleShell>
  );
}
