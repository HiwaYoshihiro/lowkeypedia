export type Role =
  | 'Đường Tà Thần'
  | 'Đi Rừng'
  | 'Đường Giữa'
  | 'Xạ Thủ'
  | 'Trợ Thủ';

export const ROLES: Role[] = [
  'Đường Tà Thần',
  'Đi Rừng',
  'Đường Giữa',
  'Xạ Thủ',
  'Trợ Thủ',
];

/** Một dòng thành tích kiểu Liquipedia: Năm | Thứ hạng | Giải đấu (link). */
export interface Achievement {
  year: string;
  placement: string;
  tournament: string;
  tournamentSlug?: string;
}

/** Một giai đoạn trong lịch sử đội tuyển của tuyển thủ. */
export interface TeamHistoryItem {
  period: string;
  team: string;
  teamSlug?: string;
}

export interface Player {
  id: string;
  slug: string;
  ign: string;
  realName?: string;
  role: Role;
  teamSlug: string | null;
  nationality: string;
  birthYear?: number;
  biography: string;
  careerHistory: string;
  teamHistory?: TeamHistoryItem[];
  achievements: Achievement[];
  avatarUrl?: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  tag: string;
  logoUrl?: string;
  region: string;
  founded?: number;
  description: string;
  achievements: Achievement[];
  updatedAt: string;
}

export interface SearchResult {
  type: 'player' | 'team' | 'tournament';
  slug: string;
  title: string;
  subtitle: string;
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  frequency: string;
  location: string;
  description: string;
  results: string[];
  updatedAt: string;
}
