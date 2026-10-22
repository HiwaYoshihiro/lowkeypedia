import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixturePlayer, fixtureTeam } from '../helpers/fixtures';

const store = vi.hoisted(() => ({
  getPlayerBySlug: vi.fn(),
  getTeamBySlug: vi.fn(),
  getTeams: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('@/lib/store', () => store);
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import PlayerDetailPage, { generateMetadata } from '@/app/tuyen-thu/[slug]/page';

describe('PlayerDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.getPlayerBySlug.mockImplementation(async (slug: string) =>
      slug === 'lai-bang' ? fixturePlayer : null
    );
    store.getTeamBySlug.mockResolvedValue(fixtureTeam);
    store.getTeams.mockResolvedValue([fixtureTeam]);
  });

  it('render tiêu đề, infobox, lịch sử đội và thành tích', async () => {
    render(await PlayerDetailPage({ params: { slug: 'lai-bang' } }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lai Bâng');
    expect(screen.getByText('Tiểu sử')).toBeInTheDocument();
    expect(screen.getByText('Sự nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử đội tuyển')).toBeInTheDocument();
    expect(screen.getByText('Thành tích thi đấu')).toBeInTheDocument();

    const teamLinks = screen.getAllByRole('link', { name: 'Saigon Phantom' });
    expect(teamLinks.length).toBeGreaterThan(0);
    for (const link of teamLinks) {
      expect(link).toHaveAttribute('href', '/doi-tuyen/saigon-phantom');
    }
    expect(screen.getByRole('link', { name: 'AIC 2025' })).toHaveAttribute(
      'href',
      '/giai-dau/aic-2025'
    );
  });

  it('render JSON-LD Person và BreadcrumbList', async () => {
    render(await PlayerDetailPage({ params: { slug: 'lai-bang' } }));

    const data = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    ).map((script) => JSON.parse(script.textContent ?? ''));

    expect(data.map((item) => item['@type'])).toEqual(['Person', 'BreadcrumbList']);
    expect(data[0].name).toBe('Lai Bâng');
    expect(data[1].itemListElement).toHaveLength(3);
  });

  it('slug không tồn tại gọi notFound', async () => {
    await expect(PlayerDetailPage({ params: { slug: 'khong-co' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('generateMetadata trả tiêu đề và canonical đúng', async () => {
    const metadata = await generateMetadata({ params: { slug: 'lai-bang' } });

    expect(metadata.title).toBe('Lai Bâng');
    expect(metadata.alternates?.canonical).toBe('/tuyen-thu/lai-bang');
    expect(metadata.openGraph).toMatchObject({ title: 'Lai Bâng — Lwkypedia' });
  });

  it('generateMetadata trả Không tìm thấy với slug lạ', async () => {
    expect(await generateMetadata({ params: { slug: 'khong-co' } })).toEqual({
      title: 'Không tìm thấy',
    });
  });
});
