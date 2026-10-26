import type { ReactNode } from 'react';

/** Một cột dữ liệu của bảng danh sách quản trị (cột "Thao tác" được thêm tự động). */
export interface AdminColumn<T> {
  /** Tiêu đề cột. */
  header: string;
  /** Class Tailwind bổ sung cho ô dữ liệu, vd "font-semibold text-wiki-darkblue". */
  className?: string;
  /** Nội dung một ô. */
  render: (row: T) => ReactNode;
}

interface AdminTableProps<T> {
  /** Nhãn nút thêm mới, vd "+ Thêm tuyển thủ". */
  addLabel: string;
  /** Mở form thêm mới. */
  onAdd: () => void;
  /** Dữ liệu của tab hiện tại. */
  items: T[];
  /** Các cột dữ liệu đứng trước cột "Thao tác". */
  columns: AdminColumn<T>[];
  /** Mở form sửa cho một dòng. */
  onEdit: (row: T) => void;
  /** Xoá một dòng (nơi gọi đã hỏi xác nhận). */
  onDelete: (row: T) => void;
}

/** Bảng danh sách dùng chung cho cả ba tab tuyển thủ / đội tuyển / giải đấu. */
export default function AdminTable<T extends { id: string }>({
  addLabel,
  onAdd,
  items,
  columns,
  onEdit,
  onDelete,
}: AdminTableProps<T>) {
  return (
    <section className="mt-4">
      <button
        onClick={onAdd}
        className="bg-wiki-blue hover:bg-wiki-darkblue text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        {addLabel}
      </button>
      <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              {columns.map((col) => (
                <th key={col.header} className="px-4 py-2.5">
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={col.className ? `px-4 py-2.5 ${col.className}` : 'px-4 py-2.5'}
                  >
                    {col.render(row)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(row)} className="text-wiki-blue hover:underline mr-3">
                    Sửa
                  </button>
                  <button onClick={() => onDelete(row)} className="text-red-600 hover:underline">
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
