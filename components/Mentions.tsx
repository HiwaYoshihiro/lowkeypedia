import Link from 'next/link';
import { segmentMentions } from '@/lib/mentions';
import type { Player, Team } from '@/lib/types';

const MENTION_PATHS = {
  team: '/doi-tuyen',
  player: '/tuyen-thu',
} as const;

/**
 * Văn bản tự động liên kết tên đội tuyển và tuyển thủ.
 *
 * Mọi tên trùng một trang đang có trong wiki sẽ trở thành liên kết tới
 * `/doi-tuyen/{slug}` (đội tuyển) hoặc `/tuyen-thu/{slug}` (tuyển thủ);
 * phần còn lại giữ nguyên văn bản thường.
 * Dùng cho cột "Kết quả" trong mục "Lịch sử vô địch" của giải đấu — ví dụ
 * "FMVP: BeTroc" sẽ tự liên kết tới trang tuyển thủ BeTroc.
 */
export default function Mentions({
  text,
  teams,
  players,
}: {
  text: string;
  teams: Pick<Team, 'name' | 'slug'>[];
  players: Pick<Player, 'ign' | 'slug'>[];
}) {
  return (
    <>
      {segmentMentions(text, { teams, players }).map((segment, index) =>
        segment.slug && segment.kind ? (
          <Link
            key={`${index}-${segment.slug}`}
            href={`${MENTION_PATHS[segment.kind]}/${segment.slug}`}
            className="link-button"
          >
            {segment.text}
          </Link>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}
