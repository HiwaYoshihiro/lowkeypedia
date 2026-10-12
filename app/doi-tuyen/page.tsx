import TeamCard from '@/components/TeamCard';
import { getPlayers, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);

  return (
    <div>
      <h1 className="wiki-title">Đội tuyển</h1>
      <p style={{ fontSize: '13px', color: '#72777d', marginTop: '6px' }}>
        Các đội tuyển Liên Quân Mobile Việt Nam thi đấu tại Đấu Trường Danh Vọng ({teams.length})
      </p>
      <div className="catalogue-grid">
        {teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            playerCount={players.filter((p) => p.teamSlug === t.slug).length}
          />
        ))}
      </div>
    </div>
  );
}
