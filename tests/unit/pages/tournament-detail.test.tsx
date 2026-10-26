import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  fixturePlayer,
  fixtureTeam,
  fixtureTournament,
} from '../helpers/fixtures';

const store = vi.hoisted(() => ({
  getTournamentBySlug: vi.fn(),
  getTeams: vi.fn(),
  getPlayers: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('@/lib/store', () => store);
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import TournamentDetailPage, {
  generateMetadata,
} from '@/app/giai-dau/[slug]/page';

describe('TournamentDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.getTournamentBySlug.mockImplementation(async (slug: string) =>
      slug === 'aic-2025' ? fixtureTournament : null
    );
    store.getTeams.mockResolvedValue([fixtureTeam]);
    store.getPlayers.mockResolvedValue([fixturePlayer]);
  });

  it('render tiêu đề, infobox và lịch sử vô địch', async () => {
    render(await TournamentDetailPage({ params: Promise.resolve({ slug: 'aic-2025' }) }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AIC 2025');
    expect(screen.getByText('Giới thiệu')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử vô địch')).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: 'Số mùa ghi nhận' }).closest('tr')
    ).toHaveTextContent('2');
    expect(screen.getByText(/Team Flash/)).toBeInTheDocument();
  });

  it('tự liên kết tên đội trong kết quả', async () => {
    render(await TournamentDetailPage({ params: Promise.resolve({ slug: 'aic-2025' }) }));

    expect(screen.getByRole('link', { name: 'Saigon Phantom' })).toHaveAttribute(
      'href',
      '/doi-tuyen/saigon-phantom'
    );
  });

  it('render JSON-LD SportsEvent', async () => {
    render(await TournamentDetailPage({ params: Promise.resolve({ slug: 'aic-2025' }) }));

    const data = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    ).map((script) => JSON.parse(script.textContent ?? ''));

    expect(data[0]).toMatchObject({
      '@type': 'SportsEvent',
      name: 'AIC 2025',
      organizer: { '@type': 'Organization', name: 'Garena' },
    });
    expect(data[0].location).toEqual({ '@type': 'Place', name: 'Việt Nam' });
  });

  it('slug không tồn tại gọi notFound', async () => {
    await expect(
      TournamentDetailPage({ params: Promise.resolve({ slug: 'khong-co' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('generateMetadata trả tiêu đề và canonical đúng', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'aic-2025' }) });

    expect(metadata.title).toBe('AIC 2025');
    expect(metadata.alternates?.canonical).toBe('/giai-dau/aic-2025');
    expect(metadata.openGraph).toMatchObject({ title: 'AIC 2025 — Lwkypedia' });
  });

  it('generateMetadata trả Không tìm thấy với slug lạ', async () => {
    expect(await generateMetadata({ params: Promise.resolve({ slug: 'khong-co' }) })).toEqual({
      title: 'Không tìm thấy',
    });
  });
});
