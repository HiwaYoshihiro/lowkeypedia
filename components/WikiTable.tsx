import type { ReactNode } from 'react';

export interface Column {
  key: string;
  label: ReactNode;
  width?: string;
  className?: string;
}

export interface Row {
  key: string;
  cells: Record<string, ReactNode>;
}

/**
 * Bảng wiki dùng chung.
 * Thay cho các `<table className="wiki-table">` viết tay rải rác ở từng trang.
 */
export function WikiTable({
  columns,
  rows,
  emptyText = 'Chưa có dữ liệu',
  caption,
}: {
  columns: Column[];
  rows: Row[];
  emptyText?: string;
  caption?: ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table className="wiki-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={column.width ? { width: column.width } : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.key}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {row.cells[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="cell-empty" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
