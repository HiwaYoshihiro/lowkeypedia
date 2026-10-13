import type { Team } from '@/lib/types';
import { EntityCard } from './EntityCard';

export const TEAM_ACCENT = '#14866d';

export default function TeamCard({ team, playerCount }: { team: Team; playerCount?: number }) {
  const metaParts = [team.founded ? `Thành lập ${team.founded}` : 'Đội tuyển'];
  if (typeof playerCount === 'number') metaParts.push(`${playerCount} tuyển thủ`);

  return (
    <EntityCard
      href={`/doi-tuyen/${team.slug}`}
      title={team.name}
      subtitle={team.region}
      meta={metaParts.join(' • ')}
      badge={team.tag ? <span className="badge badge-active">{team.tag}</span> : undefined}
      accent={TEAM_ACCENT}
      initial={team.tag || team.name}
      imageUrl={team.logoUrl}
    />
  );
}
