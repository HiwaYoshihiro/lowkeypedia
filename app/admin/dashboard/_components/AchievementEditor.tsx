import type { Achievement, Tournament } from '@/lib/types';
import { inputCls } from './Field';

/** Một dòng trong editor thành tích kiểu Liquipedia. */
export interface AchievementRow {
  year: string;
  placement: string;
  tournament: string;
  tournamentSlug: string;
}

/** Dòng thành tích trống để bắt đầu thêm mới. */
export function emptyAchievementRow(): AchievementRow {
  return { year: '', placement: '', tournament: '', tournamentSlug: '' };
}

/** Chuyển một thành tích đã lưu thành dòng trong editor. */
export function achievementToRow(a: Achievement): AchievementRow {
  return {
    year: a.year ?? '',
    placement: a.placement ?? '',
    tournament: a.tournament ?? '',
    tournamentSlug: a.tournamentSlug ?? '',
  };
}

/** Bỏ các dòng thành tích trống hoàn toàn trước khi gửi lên API. */
export function rowsToAchievements(rows: AchievementRow[]): Achievement[] {
  return rows
    .map((r) => ({
      year: r.year.trim(),
      placement: r.placement.trim(),
      tournament: r.tournament.trim(),
      ...(r.tournamentSlug ? { tournamentSlug: r.tournamentSlug } : {}),
    }))
    .filter((a) => a.year || a.placement || a.tournament);
}

interface AchievementEditorProps {
  /** Các dòng thành tích hiện tại. */
  rows: AchievementRow[];
  /** Nhận danh sách dòng mới sau mỗi lần sửa/xoá/thêm. */
  onChange: (rows: AchievementRow[]) => void;
  /** Danh sách giải đấu để chọn liên kết cho từng dòng. */
  tournaments: Tournament[];
}

/** Editor bảng thành tích: mỗi dòng Năm | Thứ hạng | Giải đấu | Link giải đấu. */
export default function AchievementEditor({ rows, onChange, tournaments }: AchievementEditorProps) {
  const setRow = (i: number, patch: Partial<AchievementRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
          <input
            className={`${inputCls} col-span-2`}
            placeholder="Năm"
            value={r.year}
            onChange={(e) => setRow(i, { year: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-3`}
            placeholder="Thứ hạng (Vô địch...)"
            value={r.placement}
            onChange={(e) => setRow(i, { placement: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-4`}
            placeholder="Giải đấu (AIC 2022...)"
            value={r.tournament}
            onChange={(e) => setRow(i, { tournament: e.target.value })}
          />
          <select
            className={`${inputCls} col-span-2`}
            value={r.tournamentSlug}
            onChange={(e) => setRow(i, { tournamentSlug: e.target.value })}
            title="Liên kết tới trang giải đấu"
          >
            <option value="">Không liên kết</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name.length > 24 ? t.name.slice(0, 24) + '…' : t.name}
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
        onClick={() => onChange([...rows, emptyAchievementRow()])}
        className="text-sm text-wiki-blue hover:underline font-semibold"
      >
        + Thêm dòng thành tích
      </button>
    </div>
  );
}
