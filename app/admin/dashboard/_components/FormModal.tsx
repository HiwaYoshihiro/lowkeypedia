import type { ReactNode } from 'react';

interface FormModalProps {
  /** Tiêu đề hiển thị ở đầu hộp thoại. */
  title: string;
  /** Các trường của form. */
  children: ReactNode;
  /** Đang gửi dữ liệu — khoá nút Lưu và đổi nhãn thành "Đang lưu...". */
  saving: boolean;
  /** Gọi khi bấm Huỷ. */
  onCancel: () => void;
  /** Gọi khi bấm Lưu. */
  onSave: () => void;
}

/** Khung hộp thoại dùng chung cho ba form thêm/sửa của dashboard. */
export default function FormModal({ title, children, saving, onCancel, onSave }: FormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl max-w-2xl mx-auto my-8 p-6">
        <h2 className="text-lg font-extrabold text-wiki-darkblue">{title}</h2>
        {children}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-wiki-blue hover:bg-wiki-darkblue disabled:opacity-60 text-white font-semibold rounded-lg"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
