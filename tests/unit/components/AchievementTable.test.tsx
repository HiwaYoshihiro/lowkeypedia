import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementTable from '@/components/AchievementTable';

describe('AchievementTable', () => {
  it('render đủ cột Năm / Thứ hạng / Giải đấu', () => {
    render(
      <AchievementTable
        title="Thành tích thi đấu"
        items={[
          {
            year: '2025',
            placement: 'Vô địch',
            tournament: 'AIC 2025',
            tournamentSlug: 'aic-2025',
          },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'Thành tích thi đấu' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Năm' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Thứ hạng' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Giải đấu' })).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('Vô địch')).toBeInTheDocument();
  });

  it('giải đấu có slug là link tới trang giải', () => {
    render(
      <AchievementTable
        title="Thành tích"
        items={[
          {
            year: '2025',
            placement: 'Vô địch',
            tournament: 'AIC 2025',
            tournamentSlug: 'aic-2025',
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'AIC 2025' })).toHaveAttribute(
      'href',
      '/giai-dau/aic-2025'
    );
  });

  it('giải đấu không có slug chỉ hiện chữ, không thành link', () => {
    render(
      <AchievementTable
        title="Thành tích"
        items={[{ year: '2024', placement: 'Á quân', tournament: 'APL' }]}
      />
    );

    expect(screen.getByText('APL')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'APL' })).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('không render gì khi danh sách rỗng', () => {
    const { container } = render(<AchievementTable title="Thành tích" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dùng dấu — cho ô trống', () => {
    render(
      <AchievementTable
        title="Thành tích"
        items={[{ year: '', placement: '', tournament: '' }]}
      />
    );

    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
