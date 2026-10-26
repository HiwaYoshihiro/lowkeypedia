import type { Tournament } from '@/lib/types';
import Field, { inputCls } from './Field';
import FormModal from './FormModal';

/** Trạng thái form giải đấu — mọi trường đều là chuỗi để gắn thẳng vào ô nhập. */
export interface TournamentFormState {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  frequency: string;
  location: string;
  description: string;
  results: string;
  updatedAt: string;
}

/** Form trống cho giải đấu mới. */
export function emptyTournament(): TournamentFormState {
  return {
    id: '',
    slug: '',
    name: '',
    organizer: '',
    frequency: '',
    location: '',
    description: '',
    results: '',
    updatedAt: '',
  };
}

/** Chuyển giải đấu đã lưu thành trạng thái form (mảng kết quả → chuỗi nhiều dòng). */
export function tournamentToForm(t: Tournament): TournamentFormState {
  return {
    ...t,
    organizer: t.organizer ?? '',
    frequency: t.frequency ?? '',
    location: t.location ?? '',
    results: t.results.join('\n'),
  };
}

/** Dựng payload gửi API từ trạng thái form (bỏ id khi tạo mới). */
export function formToTournamentPayload(f: TournamentFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    name: f.name.trim(),
    organizer: f.organizer.trim(),
    frequency: f.frequency.trim(),
    location: f.location.trim(),
    description: f.description,
    results: f.results,
  };
}

interface TournamentFormProps {
  /** Trạng thái form hiện tại. */
  form: TournamentFormState;
  /** Nhận trạng thái mới sau mỗi lần sửa một trường. */
  onChange: (form: TournamentFormState) => void;
  /** Gọi khi bấm Lưu. */
  onSave: () => void;
  /** Gọi khi bấm Huỷ. */
  onCancel: () => void;
  /** Đang gửi dữ liệu lên API. */
  saving: boolean;
}

/** Hộp thoại thêm/sửa giải đấu. */
export default function TournamentForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: TournamentFormProps) {
  return (
    <FormModal
      title={form.id ? `Sửa giải đấu: ${form.name}` : 'Thêm giải đấu mới'}
      saving={saving}
      onCancel={onCancel}
      onSave={onSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Tên giải đấu *">
          <input className={inputCls} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Slug (bỏ trống để tự tạo)">
          <input className={inputCls} value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} placeholder="vd: dau-truong-danh-vong" />
        </Field>
        <Field label="Ban tổ chức">
          <input className={inputCls} value={form.organizer} onChange={(e) => onChange({ ...form, organizer: e.target.value })} placeholder="vd: Garena Việt Nam" />
        </Field>
        <Field label="Tần suất">
          <input className={inputCls} value={form.frequency} onChange={(e) => onChange({ ...form, frequency: e.target.value })} placeholder="vd: 2 mùa/năm" />
        </Field>
        <Field label="Khu vực / Địa điểm">
          <input className={inputCls} value={form.location} onChange={(e) => onChange({ ...form, location: e.target.value })} placeholder="vd: Việt Nam" />
        </Field>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Giới thiệu" hint="bold">
          <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Lịch sử vô địch (mỗi dòng một mục)">
          <textarea className={inputCls} rows={5} value={form.results} onChange={(e) => onChange({ ...form, results: e.target.value })} placeholder={'2024 — Vô địch: Bacon Time\n2023 — Vô địch: Talon Esports'} />
          <p className="mt-1 text-xs text-slate-500">
            Tên đội trùng với đội tuyển có trong wiki sẽ tự động thành liên kết khi hiển thị — không cần cú pháp đặc biệt.
          </p>
        </Field>
      </div>
    </FormModal>
  );
}
