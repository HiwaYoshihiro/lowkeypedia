import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Mentions from '@/components/Mentions';

const teams = [{ name: 'Saigon Phantom', slug: 'saigon-phantom' }];
const players = [{ ign: 'Lai Bâng', slug: 'lai-bang' }];

describe('Mentions', () => {
  it('liên kết tên đội tới /doi-tuyen/<slug>', () => {
    render(
      <Mentions text="2025 — Vô địch: Saigon Phantom" teams={teams} players={players} />
    );

    expect(screen.getByRole('link', { name: 'Saigon Phantom' })).toHaveAttribute(
      'href',
      '/doi-tuyen/saigon-phantom'
    );
  });

  it('liên kết tên tuyển thủ tới /tuyen-thu/<slug>', () => {
    render(<Mentions text="FMVP: Lai Bâng" teams={teams} players={players} />);

    expect(screen.getByRole('link', { name: 'Lai Bâng' })).toHaveAttribute(
      'href',
      '/tuyen-thu/lai-bang'
    );
  });

  it('phần văn bản thường không thành link', () => {
    const { container } = render(
      <Mentions text="Năm 2025 — Vô địch: Saigon Phantom" teams={teams} players={players} />
    );

    expect(container.textContent).toBe('Năm 2025 — Vô địch: Saigon Phantom');
    expect(screen.queryAllByRole('link')).toHaveLength(1);
  });

  it('không có nguồn tên thì render nguyên văn', () => {
    const { container } = render(<Mentions text="Không có tên nào" teams={[]} players={[]} />);

    expect(container.textContent).toBe('Không có tên nào');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
