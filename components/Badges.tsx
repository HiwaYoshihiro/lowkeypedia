/** Huy hiệu vị trí thi đấu và trạng thái đội. */
import type { Role } from '@/lib/types';

/** Ánh xạ vị trí sang lớp màu (khai báo trong styles/wiki.css). */
const ROLE_CLASS: Record<string, string> = {
  'Đường Tà Thần': 'role-ta-than',
  'Đi Rừng': 'role-di-rung',
  'Đường Giữa': 'role-duong-giua',
  'Xạ Thủ': 'role-xa-thu',
  'Trợ Thủ': 'role-tro-thu',
};

export function RoleBadge({ role }: { role: Role | string }) {
  const cls = ROLE_CLASS[role] ?? 'role-duong-giua';
  return <span className={`badge badge-role ${cls}`}>{role}</span>;
}

/** Huy hiệu đội: có tên đội thì hiện tên, không thì "Tự do". */
export function TeamStatusBadge({ teamName }: { teamName?: string | null }) {
  if (teamName) return <span className="badge badge-active">{teamName}</span>;
  return <span className="badge badge-inactive">Tự do</span>;
}

/** Huy hiệu loại nội dung, dùng ở trang tìm kiếm và danh sách cập nhật. */
export function KindBadge({ kind }: { kind: 'player' | 'team' | 'tournament' | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    player: { label: 'Tuyển thủ', cls: 'role-duong-giua' },
    team: { label: 'Đội tuyển', cls: 'role-di-rung' },
    tournament: { label: 'Giải đấu', cls: 'role-ta-than' },
  };
  const meta = map[kind] ?? { label: kind, cls: 'role-duong-giua' };
  return <span className={`badge badge-role ${meta.cls}`}>{meta.label}</span>;
}
