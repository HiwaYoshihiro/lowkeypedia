import type { Player } from '@/lib/types';
import { EntityCard } from './EntityCard';
import { RoleBadge, TeamStatusBadge } from './Badges';

/** Màu nhấn của mục tuyển thủ, dùng chung cho thẻ và infobox. */
export const PLAYER_ACCENT = '#3366cc';

export default function PlayerCard({ player, teamName }: { player: Player; teamName?: string }) {
  return (
    <EntityCard
      href={`/tuyen-thu/${player.slug}`}
      title={player.ign}
      subtitle={player.realName ?? player.nationality}
      meta={<RoleBadge role={player.role} />}
      badge={<TeamStatusBadge teamName={teamName} />}
      accent={PLAYER_ACCENT}
      initial={player.ign}
      imageUrl={player.avatarUrl}
    />
  );
}
