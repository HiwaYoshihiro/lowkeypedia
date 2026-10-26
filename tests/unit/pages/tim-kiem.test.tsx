import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SearchResult } from '@/lib/types';

const store = vi.hoisted(() => ({
  searchAll: vi.fn(),
}));

vi.mock('@/lib/store', () => store);

import SearchPage from '@/app/tim-kiem/page';

const results: SearchResult[] = [
  {
    type: 'player',
    slug: 'lai-bang',
    title: 'Lai Bâng',
    subtitle: 'Đi Rừng • Saigon Phantom',
  },
  {
    type: 'team',
    slug: 'saigon-phantom',
    title: 'Saigon Phantom',
    subtitle: 'Việt Nam',
  },
];

describe('SearchPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.searchAll.mockResolvedValue(results);
  });

  it('render kết quả nhóm theo loại', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ q: 'lai' }) }));

    expect(store.searchAll).toHaveBeenCalledWith('lai');
    expect(screen.getByText(/Tìm thấy 2 kết quả/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tuyển thủ (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đội tuyển (1)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lai Bâng' })).toHaveAttribute(
      'href',
      '/tuyen-thu/lai-bang'
    );
    expect(screen.getByRole('link', { name: 'Saigon Phantom' })).toHaveAttribute(
      'href',
      '/doi-tuyen/saigon-phantom'
    );
  });

  it('chưa nhập từ khoá thì không gọi store và hiện hướng dẫn', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(store.searchAll).not.toHaveBeenCalled();
    expect(screen.getByText('Nhập từ khoá để tra cứu')).toBeInTheDocument();
  });

  it('không có kết quả thì hiện empty state', async () => {
    store.searchAll.mockResolvedValue([]);

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'khong-co' }) }));

    expect(screen.getByText('Không tìm thấy kết quả nào')).toBeInTheDocument();
    expect(screen.getByText('0 kết quả')).toBeInTheDocument();
  });

  it('nhận q dạng mảng và lấy phần tử đầu', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ q: ['lai', 'khac'] }) }));

    expect(store.searchAll).toHaveBeenCalledWith('lai');
  });
});
