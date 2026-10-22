import { describe, expect, it } from 'vitest';
import { segmentMentions, type MentionSources } from '@/lib/mentions';

const noPlayers: MentionSources['players'] = [];

describe('segmentMentions', () => {
  it('đánh dấu tên đội tuyển khớp trong câu', () => {
    const segments = segmentMentions('2025 — Vô địch: Saigon Phantom', {
      teams: [{ name: 'Saigon Phantom', slug: 'saigon-phantom' }],
      players: noPlayers,
    });
    expect(segments).toEqual([
      { text: '2025 — Vô địch: ' },
      { text: 'Saigon Phantom', slug: 'saigon-phantom', kind: 'team' },
    ]);
  });

  it('đánh dấu tuyển thủ theo IGN', () => {
    const segments = segmentMentions('FMVP: Khoa', {
      teams: [],
      players: [{ ign: 'Khoa', slug: 'khoa' }],
    });
    expect(segments).toEqual([
      { text: 'FMVP: ' },
      { text: 'Khoa', slug: 'khoa', kind: 'player' },
    ]);
  });

  it('ưu tiên tên dài để không cắt "Team Flash" thành "Flash"', () => {
    const segments = segmentMentions('Team Flash vô địch', {
      teams: [
        { name: 'Flash', slug: 'flash' },
        { name: 'Team Flash', slug: 'team-flash' },
      ],
      players: noPlayers,
    });
    const linked = segments.filter((segment) => segment.slug);
    expect(linked).toHaveLength(1);
    expect(linked[0]).toEqual({ text: 'Team Flash', slug: 'team-flash', kind: 'team' });
  });

  it('không khớp lồng trong từ khác', () => {
    const segments = segmentMentions('HEAVYmetal', {
      teams: [{ name: 'HEAVY', slug: 'heavy' }],
      players: noPlayers,
    });
    expect(segments).toEqual([{ text: 'HEAVYmetal' }]);
  });

  it('khớp nguyên văn tên có ký tự regex đặc biệt', () => {
    const segments = segmentMentions('Đội Team (A) thắng', {
      teams: [{ name: 'Team (A)', slug: 'team-a' }],
      players: noPlayers,
    });
    expect(segments).toContainEqual({ text: 'Team (A)', slug: 'team-a', kind: 'team' });
  });

  it('ưu tiên đội tuyển khi trùng tên với tuyển thủ', () => {
    const segments = segmentMentions('Khoa', {
      teams: [{ name: 'Khoa', slug: 'khoa-team' }],
      players: [{ ign: 'Khoa', slug: 'khoa-player' }],
    });
    expect(segments).toEqual([{ text: 'Khoa', slug: 'khoa-team', kind: 'team' }]);
  });

  it('trả mảng rỗng với văn bản rỗng', () => {
    expect(segmentMentions('', { teams: [], players: [] })).toEqual([]);
  });

  it('trả nguyên văn khi không có nguồn tên nào', () => {
    expect(segmentMentions('Vô địch AIC', { teams: [], players: [] })).toEqual([
      { text: 'Vô địch AIC' },
    ]);
  });
});
