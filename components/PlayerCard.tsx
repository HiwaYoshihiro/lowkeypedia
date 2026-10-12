import Link from 'next/link';
import type { Player } from '@/lib/types';

const ROLE_COLORS: Record<string, string> = {
  'Đường Tà Thần': 'bg-red-100 text-red-800',
  'Đi Rừng': 'bg-green-100 text-green-800',
  'Đường Giữa': 'bg-blue-100 text-blue-800',
  'Xạ Thủ': 'bg-amber-100 text-amber-800',
  'Trợ Thủ': 'bg-purple-100 text-purple-800',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
}

export function TeamStatusBadge({ teamName }: { teamName?: string }) {
  if (teamName) {
    return <span className="status-badge badge-active">{teamName}</span>;
  }
  return <span className="status-badge badge-inactive">Tự do</span>;
}

export default function PlayerCard({ player, teamName }: { player: Player; teamName?: string }) {
  return (
    <Link href={`/tuyen-thu/${player.slug}`} className="catalogue-card">
      <div className="catalogue-card-img-wrap">
        <span className="catalogue-initial">{player.ign.charAt(0).toUpperCase()}</span>
      </div>
      <div className="catalogue-card-info">
        <div className="catalogue-card-title-row">
          <h4>{player.ign}</h4>
          <TeamStatusBadge teamName={teamName} />
        </div>
        <small>{player.realName ?? player.nationality}</small>
        <div className="catalogue-card-meta">
          <RoleBadge role={player.role} />
        </div>
      </div>
    </Link>
  );
}
