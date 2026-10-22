import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixturePlayer, fixtureTeam } from '../helpers/fixtures';

const store = vi.hoisted(() => ({
  getTeamBySlug: vi.fn(),
  getPlayersByTeam: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('@/lib/store', () => store);
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

import TeamDetailPage, { generateMetadata } from '@/app/doi-tuyen/[slug]/page';

describe('TeamDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.getTeamBySlug.mockImplementation(async (slug: string) =>
      slug === 'saigon-phantom' ? fixtureTeam : null
    );
    store.getPlayersByTeam.mockResolvedValue([fixturePlayer]);
  });

  it('render tiêu đề, infobox, đội hình và thành tích', async () => {
    render(await TeamDetailPage({ params: { slug: 'saigon-phantom' } }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Saigon Phantom');
    expect(screen.getByText('Giới thiệu')).toBeInTheDocument();
    expect(screen.getByText('Đội hình hiện tại')).toBeInTheDocument();
    expect(screen.getByText('Thành tích đội tuyển')).toBeInTheDocument();
    expect(screen.getByText('1 tuyển thủ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lai Bâng' })).toHaveAttribute(
      'href',
      '/tuyen-thu/lai-bang'
    );
    expect(screen.getByRole('link', { name: 'AIC 2025' })).toHaveAttribute(
      'href',
      '/giai-dau/aic-2025'
    );
  });

  it('render JSON-LD SportsTeam', async () => {
    render(await TeamDetailPage({ params: { slug: 'saigon-phantom' } }));

    const data = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    ).map((script) => JSON.parse(script.textContent ?? ''));

    expect(data[0]).toMatchObject({ '@type': 'SportsTeam', name: 'Saigon Phantom' });
    expect(data[0].athlete).toEqual([{ '@type': 'Person', name: 'Lai Bâng' }]);
  });

  it('slug không tồn tại gọi notFound', async () => {
    await expect(TeamDetailPage({ params: { slug: 'khong-co' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalled();
  });

  it('generateMetadata trả tiêu đề và canonical đúng', async () => {
    const metadata = await generateMetadata({ params: { slug: 'saigon-phantom' } });

    expect(metadata.title).toBe('Saigon Phantom');
    expect(metadata.alternates?.canonical).toBe('/doi-tuyen/saigon-phantom');
    expect(metadata.openGraph).toMatchObject({
      title: 'Saigon Phantom — Lwkypedia',
    });
  });

  it('generateMetadata trả Không tìm thấy với slug lạ', async () => {
    expect(await generateMetadata({ params: { slug: 'khong-co' } })).toEqual({
      title: 'Không tìm thấy',
    });
  });
});
