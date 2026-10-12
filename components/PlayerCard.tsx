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

export default function PlayerCard({ player, teamName }: { player: Player; teamName?: string }) {
  return (
    <Link
      href={`/tuyen-thu/${player.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-wiki-blue transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-wiki-navy text-wiki-gold flex items-center justify-center font-extrabold text-lg shrink-0">
          {player.ign.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-wiki-darkblue truncate">{player.ign}</h3>
          <p className="text-xs text-gray-500 truncate">
            {player.realName ?? teamName ?? player.nationality}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <RoleBadge role={player.role} />
        {teamName && <span className="text-xs text-gray-500 truncate">{teamName}</span>}
      </div>
    </Link>
  );
}
