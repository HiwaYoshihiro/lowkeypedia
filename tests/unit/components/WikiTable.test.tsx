import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WikiTable } from '@/components/WikiTable';

const columns = [
  { key: 'period', label: 'Giai đoạn', width: '40%' },
  { key: 'team', label: 'Đội tuyển' },
];

describe('WikiTable', () => {
  it('render đủ header và các dòng từ props', () => {
    render(
      <WikiTable
        columns={columns}
        rows={[
          { key: 'r1', cells: { period: '2022 – nay', team: 'Saigon Phantom' } },
          { key: 'r2', cells: { period: '2020 – 2021', team: 'Team Flash' } },
        ]}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Giai đoạn' })).toHaveStyle({ width: '40%' });
    expect(screen.getByRole('columnheader', { name: 'Đội tuyển' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 dòng
    expect(screen.getByText('2022 – nay')).toBeInTheDocument();
    expect(screen.getByText('Team Flash')).toBeInTheDocument();
  });

  it('hiện emptyText khi không có dòng', () => {
    render(<WikiTable columns={columns} rows={[]} emptyText="Chưa có dữ liệu đội hình" />);

    expect(screen.getByText('Chưa có dữ liệu đội hình')).toBeInTheDocument();
    expect(screen.getAllByRole('cell')).toHaveLength(1);
  });

  it('dùng nhãn mặc định khi không truyền emptyText', () => {
    render(<WikiTable columns={columns} rows={[]} />);
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
  });

  it('render caption khi được truyền', () => {
    render(<WikiTable columns={columns} rows={[]} caption="Danh sách đội" />);
    expect(screen.getByText('Danh sách đội').tagName).toBe('CAPTION');
  });

  it('gắn className của cột vào ô dữ liệu', () => {
    render(
      <WikiTable
        columns={[{ key: 'n', label: '#', className: 'num' }]}
        rows={[{ key: 'r1', cells: { n: 1 } }]}
      />
    );

    expect(screen.getByRole('cell')).toHaveClass('num');
  });
});
