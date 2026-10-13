import TournamentCard, { TOURNAMENT_ACCENT } from '@/components/TournamentCard';
import { ArticleShell } from '@/components/ArticleShell';
import { getTournaments } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <ArticleShell
      title="🏆 Giải đấu"
      subtitle={`Các giải đấu Liên Quân Mobile quốc nội và quốc tế (${tournaments.length})`}
    >
      {tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            🏆
          </div>
          <div className="empty-state-title">Chưa có giải đấu nào</div>
          <p className="empty-state-text">Dữ liệu sẽ xuất hiện sau khi quản trị viên thêm vào.</p>
        </div>
      ) : (
        <div className="card-grid" style={{ '--card-accent': TOURNAMENT_ACCENT } as React.CSSProperties}>
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </ArticleShell>
  );
}
