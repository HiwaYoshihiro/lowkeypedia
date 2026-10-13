import type { Tournament } from '@/lib/types';
import { EntityCard } from './EntityCard';

export const TOURNAMENT_ACCENT = '#b32424';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const meta = [tournament.frequency, tournament.location].filter(Boolean).join(' • ');

  return (
    <EntityCard
      href={`/giai-dau/${tournament.slug}`}
      title={tournament.name}
      subtitle={tournament.organizer || 'Chưa rõ ban tổ chức'}
      meta={meta}
      accent={TOURNAMENT_ACCENT}
      initial={tournament.name}
    />
  );
}
