import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixturePlayer, fixtureTeam } from '../helpers/fixtures';

const store = vi.hoisted(() => ({
  getPlayers: vi.fn(),
  getTeams: vi.fn(),
}));

vi.mock('@/lib/store', () => store);

import PlayersPage from '@/app/tuyen-thu/page';

describe('PlayersPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.getPlayers.mockResolvedValue([fixturePlayer]);
    store.getTeams.mockResolvedValue([fixtureTeam]);
  });

  it('lọc theo từ khoá, đội và vị trí', async () => {
    render(
      await PlayersPage({
        searchParams: Promise.resolve({ q: 'lai', team: 'saigon-phantom', role: 'Đi Rừng' }),
      })
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tuyển thủ');
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByText('Lai Bâng').closest('a')).toHaveAttribute(
      'href',
      '/tuyen-thu/lai-bang'
    );
  });

  it('hiện empty state khi bộ lọc không khớp', async () => {
    render(await PlayersPage({ searchParams: Promise.resolve({ team: 'team-flash' }) }));

    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(screen.getByText('Không tìm thấy tuyển thủ nào')).toBeInTheDocument();
    expect(screen.queryByText('Lai Bâng')).toBeNull();
  });

  it('lọc tuyển thủ tự do bằng __none', async () => {
    render(await PlayersPage({ searchParams: Promise.resolve({ team: '__none' }) }));

    expect(screen.getByText('Không tìm thấy tuyển thủ nào')).toBeInTheDocument();
  });

  it('từ khoá không dấu vẫn khớp tên có dấu', async () => {
    render(await PlayersPage({ searchParams: Promise.resolve({ q: 'lai bang' }) }));

    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByText('Lai Bâng')).toBeInTheDocument();
  });
});
