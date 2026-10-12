import TournamentCard from '@/components/TournamentCard';
import { getTournaments } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div>
      <h1 className="wiki-title">Giải đấu</h1>
      <p style={{ fontSize: '13px', color: '#72777d', marginTop: '6px' }}>
        Các giải đấu Liên Quân Mobile quốc nội và quốc tế ({tournaments.length})
      </p>
      <div className="catalogue-grid">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
}
