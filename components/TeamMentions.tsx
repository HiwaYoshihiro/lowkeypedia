import Link from 'next/link';
import { segmentTeamMentions } from '@/lib/mentions';
import type { Team } from '@/lib/types';

/**
 * Văn bản tự động liên kết tên đội tuyển.
 *
 * Mọi tên trùng một đội đang có trong wiki sẽ trở thành liên kết tới
 * `/doi-tuyen/{slug}`; phần còn lại giữ nguyên văn bản thường.
 * Dùng cho cột "Kết quả" trong mục "Lịch sử vô địch" của giải đấu.
 */
export default function TeamMentions({
  text,
  teams,
}: {
  text: string;
  teams: Pick<Team, 'name' | 'slug'>[];
}) {
  return (
    <>
      {segmentTeamMentions(text, teams).map((segment, index) =>
        segment.slug ? (
          <Link
            key={`${index}-${segment.slug}`}
            href={`/doi-tuyen/${segment.slug}`}
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
