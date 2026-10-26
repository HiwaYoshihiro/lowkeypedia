import type { Team, TeamHistoryItem } from '@/lib/types';
import { inputCls } from './Field';

/** Một dòng trong editor lịch sử đội tuyển. */
export interface TeamHistoryRow {
  period: string;
  team: string;
  teamSlug: string;
}

/** Dòng lịch sử trống để bắt đầu thêm mới. */
export function emptyTeamHistoryRow(): TeamHistoryRow {
  return { period: '', team: '', teamSlug: '' };
}

/** Chuyển một giai đoạn đã lưu thành dòng trong editor. */
export function teamHistoryToRow(h: TeamHistoryItem): TeamHistoryRow {
  return { period: h.period ?? '', team: h.team ?? '', teamSlug: h.teamSlug ?? '' };
}

/** Bỏ các dòng lịch sử trống hoàn toàn; trả `undefined` khi không còn dòng nào. */
export function rowsToTeamHistory(rows: TeamHistoryRow[]): TeamHistoryItem[] | undefined {
  const out = rows
    .map((r) => ({
      period: r.period.trim(),
      team: r.team.trim(),
      ...(r.teamSlug ? { teamSlug: r.teamSlug } : {}),
    }))
    .filter((h) => h.period || h.team);
  return out.length > 0 ? out : undefined;
}

interface TeamHistoryEditorProps {
  /** Các giai đoạn hiện tại. */
  rows: TeamHistoryRow[];
  /** Nhận danh sách dòng mới sau mỗi lần sửa/xoá/thêm. */
  onChange: (rows: TeamHistoryRow[]) => void;
  /** Danh sách đội tuyển để chọn liên kết cho từng dòng. */
  teams: Team[];
}

/** Editor lịch sử đội tuyển: mỗi dòng Giai đoạn | Đội tuyển | Link đội. */
export default function TeamHistoryEditor({ rows, onChange, teams }: TeamHistoryEditorProps) {
  const setRow = (i: number, patch: Partial<TeamHistoryRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
          <input
            className={`${inputCls} col-span-3`}
            placeholder="Giai đoạn (2018–2022)"
            value={r.period}
            onChange={(e) => setRow(i, { period: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-5`}
            placeholder="Đội tuyển"
            value={r.team}
            onChange={(e) => setRow(i, { team: e.target.value })}
          />
          <select
            className={`${inputCls} col-span-3`}
            value={r.teamSlug}
            onChange={(e) => {
              const name = teams.find((t) => t.slug === e.target.value)?.name ?? r.team;
              setRow(i, { teamSlug: e.target.value, team: e.target.value ? name : r.team });
            }}
            title="Liên kết tới trang đội tuyển"
          >
            <option value="">Không liên kết</option>
            {teams.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="col-span-1 text-red-600 hover:text-red-800 text-lg font-bold"
            title="Xoá dòng"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, emptyTeamHistoryRow()])}
        className="text-sm text-wiki-blue hover:underline font-semibold"
      >
        + Thêm giai đoạn
      </button>
    </div>
  );
}
