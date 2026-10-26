import { ROLES, type Player, type Team, type Tournament } from '@/lib/types';
import AchievementEditor, {
  achievementToRow,
  rowsToAchievements,
  type AchievementRow,
} from './AchievementEditor';
import Field, { inputCls } from './Field';
import FormModal from './FormModal';
import TeamHistoryEditor, {
  rowsToTeamHistory,
  teamHistoryToRow,
  type TeamHistoryRow,
} from './TeamHistoryEditor';

/** Trạng thái form tuyển thủ — mọi trường đều là chuỗi để gắn thẳng vào ô nhập. */
export interface PlayerFormState {
  id: string;
  slug: string;
  ign: string;
  realName: string;
  role: Player['role'];
  teamSlug: string;
  nationality: string;
  birthYear: string;
  biography: string;
  careerHistory: string;
  teamHistory: TeamHistoryRow[];
  achievements: AchievementRow[];
  avatarUrl: string;
  updatedAt: string;
}

/** Form trống cho tuyển thủ mới. */
export function emptyPlayer(): PlayerFormState {
  return {
    id: '',
    slug: '',
    ign: '',
    realName: '',
    role: 'Đường Giữa',
    teamSlug: '',
    nationality: 'Việt Nam',
    birthYear: '',
    biography: '',
    careerHistory: '',
    teamHistory: [],
    achievements: [],
    avatarUrl: '',
    updatedAt: '',
  };
}

/** Chuyển tuyển thủ đã lưu thành trạng thái form (số → chuỗi, null → chuỗi rỗng). */
export function playerToForm(p: Player): PlayerFormState {
  return {
    ...p,
    realName: p.realName ?? '',
    teamSlug: p.teamSlug ?? '',
    birthYear: p.birthYear ? String(p.birthYear) : '',
    teamHistory: (p.teamHistory ?? []).map(teamHistoryToRow),
    achievements: p.achievements.map(achievementToRow),
    avatarUrl: p.avatarUrl ?? '',
  };
}

/** Dựng payload gửi API từ trạng thái form (bỏ id khi tạo mới, bỏ dòng trống). */
export function formToPlayerPayload(f: PlayerFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    ign: f.ign.trim(),
    realName: f.realName.trim(),
    role: f.role,
    teamSlug: f.teamSlug.trim() || null,
    nationality: f.nationality.trim() || 'Việt Nam',
    birthYear: f.birthYear.trim() ? Number(f.birthYear.trim()) : undefined,
    biography: f.biography,
    careerHistory: f.careerHistory,
    teamHistory: rowsToTeamHistory(f.teamHistory),
    achievements: rowsToAchievements(f.achievements),
    avatarUrl: f.avatarUrl.trim(),
  };
}

interface PlayerFormProps {
  /** Trạng thái form hiện tại. */
  form: PlayerFormState;
  /** Nhận trạng thái mới sau mỗi lần sửa một trường. */
  onChange: (form: PlayerFormState) => void;
  /** Gọi khi bấm Lưu. */
  onSave: () => void;
  /** Gọi khi bấm Huỷ. */
  onCancel: () => void;
  /** Đang gửi dữ liệu lên API. */
  saving: boolean;
  /** Danh sách đội để chọn "Đội hiện tại" và liên kết lịch sử đội. */
  teams: Team[];
  /** Danh sách giải để liên kết dòng thành tích. */
  tournaments: Tournament[];
}

/** Hộp thoại thêm/sửa tuyển thủ. */
export default function PlayerForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  teams,
  tournaments,
}: PlayerFormProps) {
  return (
    <FormModal
      title={form.id ? `Sửa tuyển thủ: ${form.ign}` : 'Thêm tuyển thủ mới'}
      saving={saving}
      onCancel={onCancel}
      onSave={onSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Tên thi đấu (IGN) *">
          <input className={inputCls} value={form.ign} onChange={(e) => onChange({ ...form, ign: e.target.value })} />
        </Field>
        <Field label="Tên thật">
          <input className={inputCls} value={form.realName} onChange={(e) => onChange({ ...form, realName: e.target.value })} />
        </Field>
        <Field label="Slug (bỏ trống để tự tạo)">
          <input className={inputCls} value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} placeholder="vd: lai-bang" />
        </Field>
        <Field label="Vị trí *">
          <select className={inputCls} value={form.role} onChange={(e) => onChange({ ...form, role: e.target.value as Player['role'] })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Đội hiện tại">
          <select className={inputCls} value={form.teamSlug} onChange={(e) => onChange({ ...form, teamSlug: e.target.value })}>
            <option value="">Tự do / đã giải nghệ</option>
            {teams.map((t) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quốc tịch">
          <input className={inputCls} value={form.nationality} onChange={(e) => onChange({ ...form, nationality: e.target.value })} />
        </Field>
        <Field label="Năm sinh">
          <input className={inputCls} inputMode="numeric" value={form.birthYear} onChange={(e) => onChange({ ...form, birthYear: e.target.value })} placeholder="vd: 2001" />
        </Field>
        <Field label="Ảnh đại diện (URL)">
          <input className={inputCls} value={form.avatarUrl} onChange={(e) => onChange({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
        </Field>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Tiểu sử" hint="bold">
          <textarea className={inputCls} rows={4} value={form.biography} onChange={(e) => onChange({ ...form, biography: e.target.value })} />
        </Field>
        <Field label="Sự nghiệp" hint="bold">
          <textarea className={inputCls} rows={4} value={form.careerHistory} onChange={(e) => onChange({ ...form, careerHistory: e.target.value })} />
        </Field>
        <Field label="Lịch sử đội tuyển">
          <TeamHistoryEditor
            rows={form.teamHistory}
            onChange={(teamHistory) => onChange({ ...form, teamHistory })}
            teams={teams}
          />
        </Field>
        <Field label="Thành tích thi đấu">
          <AchievementEditor
            rows={form.achievements}
            onChange={(achievements) => onChange({ ...form, achievements })}
            tournaments={tournaments}
          />
        </Field>
      </div>
    </FormModal>
  );
}
