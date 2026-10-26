import type { Team, Tournament } from '@/lib/types';
import AchievementEditor, {
  achievementToRow,
  rowsToAchievements,
  type AchievementRow,
} from './AchievementEditor';
import Field, { inputCls } from './Field';
import FormModal from './FormModal';

/** Trạng thái form đội tuyển — mọi trường đều là chuỗi để gắn thẳng vào ô nhập. */
export interface TeamFormState {
  id: string;
  slug: string;
  name: string;
  tag: string;
  logoUrl: string;
  region: string;
  founded: string;
  description: string;
  achievements: AchievementRow[];
  updatedAt: string;
}

/** Form trống cho đội tuyển mới. */
export function emptyTeam(): TeamFormState {
  return {
    id: '',
    slug: '',
    name: '',
    tag: '',
    logoUrl: '',
    region: 'Việt Nam',
    founded: '',
    description: '',
    achievements: [],
    updatedAt: '',
  };
}

/** Chuyển đội tuyển đã lưu thành trạng thái form (số → chuỗi, null → chuỗi rỗng). */
export function teamToForm(t: Team): TeamFormState {
  return {
    ...t,
    logoUrl: t.logoUrl ?? '',
    founded: t.founded ? String(t.founded) : '',
    achievements: t.achievements.map(achievementToRow),
  };
}

/** Dựng payload gửi API từ trạng thái form (bỏ id khi tạo mới, bỏ dòng trống). */
export function formToTeamPayload(f: TeamFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    name: f.name.trim(),
    tag: f.tag.trim(),
    logoUrl: f.logoUrl.trim(),
    region: f.region.trim() || 'Việt Nam',
    founded: f.founded.trim() ? Number(f.founded.trim()) : undefined,
    description: f.description,
    achievements: rowsToAchievements(f.achievements),
  };
}

interface TeamFormProps {
  /** Trạng thái form hiện tại. */
  form: TeamFormState;
  /** Nhận trạng thái mới sau mỗi lần sửa một trường. */
  onChange: (form: TeamFormState) => void;
  /** Gọi khi bấm Lưu. */
  onSave: () => void;
  /** Gọi khi bấm Huỷ. */
  onCancel: () => void;
  /** Đang gửi dữ liệu lên API. */
  saving: boolean;
  /** Danh sách giải để liên kết dòng thành tích. */
  tournaments: Tournament[];
}

/** Hộp thoại thêm/sửa đội tuyển. */
export default function TeamForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  tournaments,
}: TeamFormProps) {
  return (
    <FormModal
      title={form.id ? `Sửa đội tuyển: ${form.name}` : 'Thêm đội tuyển mới'}
      saving={saving}
      onCancel={onCancel}
      onSave={onSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Tên đội *">
          <input className={inputCls} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Tag">
          <input className={inputCls} value={form.tag} onChange={(e) => onChange({ ...form, tag: e.target.value })} placeholder="vd: SGP" />
        </Field>
        <Field label="Slug (bỏ trống để tự tạo)">
          <input className={inputCls} value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} placeholder="vd: saigon-phantom" />
        </Field>
        <Field label="Khu vực">
          <input className={inputCls} value={form.region} onChange={(e) => onChange({ ...form, region: e.target.value })} />
        </Field>
        <Field label="Năm thành lập">
          <input className={inputCls} inputMode="numeric" value={form.founded} onChange={(e) => onChange({ ...form, founded: e.target.value })} placeholder="vd: 2017" />
        </Field>
        <Field label="Logo (URL)">
          <input className={inputCls} value={form.logoUrl} onChange={(e) => onChange({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
        </Field>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Mô tả" hint="bold">
          <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Thành tích đội tuyển">
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
