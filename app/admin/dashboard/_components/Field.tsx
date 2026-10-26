import type { ReactNode } from 'react';

/** Class chung cho ô nhập liệu (input/select/textarea) trong các form quản trị. */
export const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wiki-blue';

/** Class chung cho nhãn của một trường. */
export const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

interface FieldProps {
  /** Nhãn hiển thị phía trên ô nhập. */
  label: string;
  /** Ô nhập liệu của trường. */
  children: ReactNode;
  /** Có giá trị thì hiện thêm gợi ý định dạng chữ đậm bên dưới ô nhập. */
  hint?: string;
}

/** Một trường trong form quản trị: nhãn + ô nhập + gợi ý tuỳ chọn. */
export default function Field({ label, children, hint }: FieldProps) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-slate-500">
          Mẹo: dùng **chữ** để <strong>in đậm</strong>.
        </p>
      )}
    </div>
  );
}
