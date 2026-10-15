import type { Team } from './types';

/** Một đoạn văn bản đã tách sẵn để render; có `slug` nghĩa là đoạn đó là tên một đội tuyển trong wiki. */
export interface MentionSegment {
  text: string;
  slug?: string;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tách văn bản thành các đoạn, đánh dấu đoạn trùng tên đội tuyển đang có trong wiki.
 *
 * Dùng cho mục "Lịch sử vô địch" của giải đấu: quản trị viên chỉ cần gõ tên đội như
 * văn bản thường ("2025 — Vô địch: Saigon Phantom (FMVP: Khoa)") — tên trùng một đội
 * có trang sẽ tự thành liên kết, tên lạ (đội ngoài wiki) giữ nguyên chữ.
 *
 * Quy tắc khớp:
 * - Không phân biệt hoa/thường; có dấu giữ nguyên dấu.
 * - Tên dài xếp trước trong biểu thức để "Team Flash" không bị cắt thành "Flash".
 * - Hai lớp biên `\p{L}\p{N}` chặn khớp lồng trong từ khác ("HEAVY" trong "HEAVYmetal").
 */
export function segmentTeamMentions(
  text: string,
  teams: Pick<Team, 'name' | 'slug'>[],
): MentionSegment[] {
  if (!text) return [];
  const names = teams
    .map((team) => ({ name: team.name.trim(), slug: team.slug.trim() }))
    .filter((team) => team.name.length > 0 && team.slug.length > 0)
    .sort((a, b) => b.name.length - a.name.length);
  if (names.length === 0) return [{ text }];

  const slugByName = new Map<string, string>();
  for (const { name, slug } of names) {
    const key = name.toLocaleLowerCase('vi');
    if (!slugByName.has(key)) slugByName.set(key, slug);
  }

  const pattern = names.map((team) => escapeRegExp(team.name)).join('|');
  const mention = new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'giu');

  const segments: MentionSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = mention.exec(text)) !== null) {
    const index = match.index;
    if (index > last) segments.push({ text: text.slice(last, index) });
    const slug = slugByName.get(match[0].toLocaleLowerCase('vi'));
    segments.push({ text: match[0], ...(slug ? { slug } : {}) });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
