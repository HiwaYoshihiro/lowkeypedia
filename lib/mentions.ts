import type { Player, Team } from './types';

/** Loại trang mà một đoạn văn bản trùng tên trỏ tới. */
export type MentionKind = 'team' | 'player';

/** Một đoạn văn bản đã tách sẵn để render; có `slug` + `kind` nghĩa là đoạn đó là tên một trang trong wiki. */
export interface MentionSegment {
  text: string;
  slug?: string;
  kind?: MentionKind;
}

/** Nguồn tên để dò liên kết: đội tuyển (so theo `name`) và tuyển thủ (so theo `ign`). */
export interface MentionSources {
  teams: Pick<Team, 'name' | 'slug'>[];
  players: Pick<Player, 'ign' | 'slug'>[];
}

interface MentionTarget {
  name: string;
  slug: string;
  kind: MentionKind;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tách văn bản thành các đoạn, đánh dấu đoạn trùng tên đội tuyển hoặc tuyển thủ đang có trong wiki.
 *
 * Dùng cho mục "Lịch sử vô địch" của giải đấu: quản trị viên chỉ cần gõ tên như văn
 * bản thường ("2025 — Vô địch: Saigon Phantom (FMVP: Khoa)") — tên trùng một trang
 * sẵn có (đội tuyển theo tên đội, tuyển thủ theo IGN) sẽ tự thành liên kết, tên lạ
 * (đội/tuyển thủ ngoài wiki) giữ nguyên chữ.
 *
 * Quy tắc khớp:
 * - Không phân biệt hoa/thường; có dấu giữ nguyên dấu.
 * - Tên dài xếp trước trong biểu thức để "Team Flash" không bị cắt thành "Flash".
 * - Nếu một tên vừa là đội vừa là tuyển thủ (hi hữu), đội tuyển được ưu tiên.
 * - Hai lớp biên `\p{L}\p{N}` chặn khớp lồng trong từ khác ("HEAVY" trong "HEAVYmetal").
 */
export function segmentMentions(text: string, sources: MentionSources): MentionSegment[] {
  if (!text) return [];

  const targets = [
    ...sources.teams.map<MentionTarget>((team) => ({
      name: team.name.trim(),
      slug: team.slug.trim(),
      kind: 'team',
    })),
    ...sources.players.map<MentionTarget>((player) => ({
      name: player.ign.trim(),
      slug: player.slug.trim(),
      kind: 'player',
    })),
  ].filter((target) => target.name.length > 0 && target.slug.length > 0);

  // Đội tuyển đứng trước tuyển thủ trong danh sách nên khi trùng tên, đội được giữ lại.
  const byKey = new Map<string, MentionTarget>();
  const unique: MentionTarget[] = [];
  for (const target of targets) {
    const key = target.name.toLocaleLowerCase('vi');
    if (byKey.has(key)) continue;
    byKey.set(key, target);
    unique.push(target);
  }
  if (unique.length === 0) return [{ text }];

  unique.sort((a, b) => b.name.length - a.name.length);
  const pattern = unique.map((target) => escapeRegExp(target.name)).join('|');
  const mention = new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'giu');

  const segments: MentionSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = mention.exec(text)) !== null) {
    const index = match.index;
    if (index > last) segments.push({ text: text.slice(last, index) });
    const target = byKey.get(match[0].toLocaleLowerCase('vi'));
    if (target) segments.push({ text: match[0], slug: target.slug, kind: target.kind });
    else segments.push({ text: match[0] });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
