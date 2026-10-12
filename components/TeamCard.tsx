import Link from 'next/link';
import type { Team } from '@/lib/types';

export default function TeamCard({ team, playerCount }: { team: Team; playerCount?: number }) {
  return (
    <Link href={`/doi-tuyen/${team.slug}`} className="catalogue-card">
      <div className="catalogue-card-img-wrap catalogue-green">
        <span className="catalogue-initial">{team.tag.charAt(0).toUpperCase()}</span>
      </div>
      <div className="catalogue-card-info">
        <div className="catalogue-card-title-row">
          <h4>{team.name}</h4>
          <span className="status-badge badge-active">{team.tag}</span>
        </div>
        <small>{team.region}</small>
        <div className="catalogue-card-meta" style={{ color: '#72777d' }}>
          {team.founded ? `Thành lập ${team.founded}` : 'Đội tuyển'}
          {typeof playerCount === 'number' && ` · ${playerCount} tuyển thủ`}
        </div>
      </div>
    </Link>
  );
}
