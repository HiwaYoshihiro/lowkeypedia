import Link from 'next/link';
import type { Tournament } from '@/lib/types';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Link href={`/giai-dau/${tournament.slug}`} className="catalogue-card">
      <div className="catalogue-card-img-wrap catalogue-red">
        <span className="catalogue-initial">{tournament.name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="catalogue-card-info">
        <div className="catalogue-card-title-row">
          <h4>{tournament.name}</h4>
        </div>
        <small>{tournament.organizer || 'Chưa rõ ban tổ chức'}</small>
        <div className="catalogue-card-meta" style={{ color: '#72777d' }}>
          {tournament.frequency}
          {tournament.location ? ` · ${tournament.location}` : ''}
        </div>
      </div>
    </Link>
  );
}
