import TeamCard from '@/components/TeamCard';
import { getPlayers, getTeams } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-wiki-darkblue">Đội tuyển</h1>
      <p className="text-gray-600 mt-1 text-sm">
        Các đội tuyển Liên Quân Mobile Việt Nam thi đấu tại Đấu Trường Danh Vọng ({teams.length})
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
