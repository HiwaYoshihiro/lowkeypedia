import type { Player, Team, Tournament } from '@/lib/types';

/**
 * Fixture dùng chung cho component test và smoke test trang.
 * Slug cố định để assertion về href không phụ thuộc dữ liệu seed.
 */

export const fixturePlayer: Player = {
  id: 'player-lai-bang',
  slug: 'lai-bang',
  ign: 'Lai Bâng',
  realName: 'Nguyễn Văn A',
  role: 'Đi Rừng',
  teamSlug: 'saigon-phantom',
  nationality: 'Việt Nam',
  birthYear: 2002,
  biography: '**Lai Bâng** là tuyển thủ đi rừng của Saigon Phantom.',
  careerHistory: '2022 – nay: Saigon Phantom',
  teamHistory: [{ period: '2022 – nay', team: 'Saigon Phantom', teamSlug: 'saigon-phantom' }],
  achievements: [
    {
      year: '2025',
      placement: 'Vô địch',
      tournament: 'AIC 2025',
      tournamentSlug: 'aic-2025',
    },
  ],
  avatarUrl: '/images/lai-bang.png',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

export const fixtureTeam: Team = {
  id: 'team-saigon-phantom',
  slug: 'saigon-phantom',
  name: 'Saigon Phantom',
  tag: 'SGP',
  logoUrl: '/images/saigon-phantom.png',
  region: 'Việt Nam',
  founded: 2017,
  description: '**Saigon Phantom** là đội tuyển Liên Quân Mobile nổi tiếng.',
  achievements: [
    {
      year: '2025',
      placement: 'Vô địch',
      tournament: 'AIC 2025',
      tournamentSlug: 'aic-2025',
    },
  ],
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const fixtureTournament: Tournament = {
  id: 'tournament-aic-2025',
  slug: 'aic-2025',
  name: 'AIC 2025',
  organizer: 'Garena',
  frequency: 'Hằng năm',
  location: 'Việt Nam',
  description: 'Giải **AIC** dành cho các đội tuyển Liên Quân Mobile.',
  results: ['2025 — Vô địch: Saigon Phantom', '2024 — Vô địch: Team Flash'],
  updatedAt: '2026-08-01T00:00:00.000Z',
};
