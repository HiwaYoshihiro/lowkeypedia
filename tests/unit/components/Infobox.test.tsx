import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Infobox } from '@/components/Infobox';

describe('Infobox', () => {
  it('render nhãn và giá trị của từng dòng', () => {
    render(
      <Infobox
        title="Lai Bâng"
        subtitle="Đi Rừng"
        rows={[
          ['Vị trí', 'Đi Rừng'],
          ['Quốc tịch', 'Việt Nam'],
        ]}
      />
    );

    expect(screen.getByText('Lai Bâng')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Đi Rừng' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Vị trí' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Việt Nam' })).toBeInTheDocument();
  });

  it('bỏ qua dòng rỗng hoặc null', () => {
    render(
      <Infobox
        title="Lai Bâng"
        rows={[
          ['Vị trí', 'Đi Rừng'],
          ['Quê quán', ''],
          ['Ghi chú', null],
          ['Khác', undefined],
        ]}
      />
    );

    expect(screen.queryByText('Quê quán')).toBeNull();
    expect(screen.queryByText('Ghi chú')).toBeNull();
    expect(screen.queryByText('Khác')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('render ảnh với alt là tiêu đề khi có imageUrl', () => {
    render(<Infobox title="Lai Bâng" imageUrl="/images/lai-bang.png" rows={[]} />);

    const image = screen.getByRole('img', { name: 'Lai Bâng' });
    expect(image).toHaveAttribute('src', '/images/lai-bang.png');
  });

  it('không có ảnh thì hiện chữ cái đầu', () => {
    const { container } = render(<Infobox title="Saigon Phantom" initial="SGP" rows={[]} />);
    expect(container.querySelector('.infobox-initial')).toHaveTextContent('S');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
