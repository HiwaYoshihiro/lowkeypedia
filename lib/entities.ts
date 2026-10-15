import type { SearchResult } from './types';

/** Loại thực thể trong wiki. */
export type EntityKind = SearchResult['type'];

/** Đường dẫn tới trang chi tiết của từng loại. */
export const KIND_HREF: Record<EntityKind, (slug: string) => string> = {
  player: (s) => `/tuyen-thu/${s}`,
  team: (s) => `/doi-tuyen/${s}`,
  tournament: (s) => `/giai-dau/${s}`,
};

/** Nhãn hiển thị của từng loại. */
export const KIND_LABEL: Record<EntityKind, string> = {
  player: 'Tuyển thủ',
  team: 'Đội tuyển',
  tournament: 'Giải đấu',
};

/** Thứ tự nhóm khi hiển thị kết quả. */
export const KIND_ORDER: EntityKind[] = ['player', 'team', 'tournament'];
