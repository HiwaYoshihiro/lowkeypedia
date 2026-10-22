import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixturePlayer, fixtureTeam, fixtureTournament } from '../helpers/fixtures';

const store = vi.hoisted(() => ({
  getPlayers: vi.fn(),
  getTeams: vi.fn(),
  getTournaments: vi.fn(),
}));

vi.mock('@/lib/store', () => store);

import HomePage from '@/app/page';

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.getPlayers.mockResolvedValue([fixturePlayer]);
    store.getTeams.mockResolvedValue([fixtureTeam]);
    store.getTournaments.mockResolvedValue([fixtureTournament]);
  });

  it('render hero, thống kê và các mục nội dung', async () => {
    render(await HomePage());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Chào mừng đến với LWKYPEDIA'
    );
    expect(screen.getByRole('heading', { name: /Tuyển thủ nổi bật/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Đội tuyển/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Giải đấu/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cập nhật gần đây' })).toBeInTheDocument();
  });

  it('hiện thẻ của fixture và danh sách cập nhật gần đây', async () => {
    render(await HomePage());

    expect(screen.getAllByText('Lai Bâng').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Saigon Phantom').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AIC 2025').length).toBeGreaterThan(0);

    const recent = screen
      .getByRole('heading', { name: 'Cập nhật gần đây' })
      .closest('section');
    expect(recent).not.toBeNull();
    expect(recent).toHaveTextContent('Lai Bâng');
    expect(recent).toHaveTextContent('Saigon Phantom');
    expect(recent).toHaveTextContent('AIC 2025');
  });

  it('không crash khi chưa có dữ liệu', async () => {
    store.getPlayers.mockResolvedValue([]);
    store.getTeams.mockResolvedValue([]);
    store.getTournaments.mockResolvedValue([]);

    render(await HomePage());

    expect(screen.getByRole('heading', { name: 'Cập nhật gần đây' })).toBeInTheDocument();
    expect(screen.queryByText('Lai Bâng')).toBeNull();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
  });
});
