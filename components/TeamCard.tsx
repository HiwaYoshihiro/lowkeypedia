import Link from 'next/link';
import type { Team } from '@/lib/types';

export default function TeamCard({ team, playerCount }: { team: Team; playerCount?: number }) {
  return (
    <Link
      href={`/doi-tuyen/${team.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-wiki-blue transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-wiki-navy text-wiki-gold flex items-center justify-center font-extrabold text-sm shrink-0">
          {team.tag}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-wiki-darkblue truncate">{team.name}</h3>
          <p className="text-xs text-gray-500">{team.region}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{team.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{team.founded ? `Thành lập ${team.founded}` : 'Đội tuyển'}</span>
        {typeof playerCount === 'number' && <span>{playerCount} tuyển thủ</span>}
      </div>
    </Link>
  );
}
