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
  achievements: string[];
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
  achievements: string[];
  updatedAt: string;
}

export interface SearchResult {
  type: 'player' | 'team';
  slug: string;
  title: string;
  subtitle: string;
}
