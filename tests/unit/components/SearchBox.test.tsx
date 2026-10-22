import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

import SearchBox from '@/components/SearchBox';

const results = [
  {
    type: 'player' as const,
    slug: 'lai-bang',
    title: 'Lai Bâng',
    subtitle: 'Đi Rừng • Saigon Phantom',
  },
  {
    type: 'team' as const,
    slug: 'saigon-phantom',
    title: 'Saigon Phantom',
    subtitle: 'Việt Nam',
  },
];

function ok(data: unknown): Response {
  return { ok: true, status: 200, json: async () => data } as unknown as Response;
}

function fail(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

const fetchMock = vi.fn();

function type(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } });
}

/** Chạy hết debounce 180ms và flush microtask của fetch. */
async function settle(ms = 180): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('SearchBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    navigation.push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('debounce 180ms rồi gọi /api/search và hiện nhóm Tuyển thủ', async () => {
    fetchMock.mockResolvedValue(ok(results));
    render(<SearchBox />);

    type(screen.getByRole('combobox'), 'lai');
    expect(fetchMock).not.toHaveBeenCalled();

    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/search?q=lai',
      expect.objectContaining({ signal: expect.anything() })
    );

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('group', { name: 'Tuyển thủ' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /Lai Bâng/ })).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: 'Đội tuyển' })).toBeInTheDocument();
  });

  it('không gọi fetch khi ô rỗng; xoá nội dung thì đóng panel', async () => {
    fetchMock.mockResolvedValue(ok(results));
    render(<SearchBox />);

    expect(fetchMock).not.toHaveBeenCalled();

    const input = screen.getByRole('combobox');
    type(input, 'lai');
    await settle();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xoá nội dung tìm kiếm' }));

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveValue('');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lỗi HTTP 500 hiện thông báo không có kết quả, không crash', async () => {
    fetchMock.mockResolvedValue(fail(500));
    render(<SearchBox />);

    type(screen.getByRole('combobox'), 'lai');
    await settle();

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText(/Không tìm thấy kết quả cho/)).toHaveTextContent('“lai”');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('bỏ qua response cũ về sau response mới', async () => {
    const pending: Array<(response: Response) => void> = [];
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          pending.push(resolve);
        })
    );
    render(<SearchBox />);

    const input = screen.getByRole('combobox');
    type(input, 'a');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    type(input, 'ab');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Response của 'ab' về trước.
    await act(async () => {
      pending[1](
        ok([
          {
            type: 'team',
            slug: 'saigon-phantom',
            title: 'Saigon Phantom',
            subtitle: 'Việt Nam',
          },
        ])
      );
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Saigon Phantom')).toBeInTheDocument();

    // Response của 'a' về sau nhưng không được ghi đè.
    await act(async () => {
      pending[0](
        ok([{ type: 'player', slug: 'lai-bang', title: 'Kết quả cũ', subtitle: '' }])
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.queryByText('Kết quả cũ')).toBeNull();
    expect(screen.getByText('Saigon Phantom')).toBeInTheDocument();
  });

  it('ArrowDown 2 lần rồi Enter mở đúng item đang highlight', async () => {
    fetchMock.mockResolvedValue(ok(results));
    render(<SearchBox />);

    const input = screen.getByRole('combobox');
    type(input, 'lai');
    await settle();

    // 2 item: highlight 0 → 1 → 0, nên Enter mở item đầu (player).
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(navigation.push).toHaveBeenCalledWith('/tuyen-thu/lai-bang');
  });

  it('Escape đóng panel', async () => {
    fetchMock.mockResolvedValue(ok(results));
    render(<SearchBox />);

    const input = screen.getByRole('combobox');
    type(input, 'lai');
    await settle();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('nút Xem tất cả kết quả chuyển tới trang tìm kiếm', async () => {
    fetchMock.mockResolvedValue(ok(results));
    render(<SearchBox />);

    type(screen.getByRole('combobox'), 'lai');
    await settle();

    fireEvent.click(screen.getByRole('button', { name: /Xem tất cả kết quả/ }));

    expect(navigation.push).toHaveBeenCalledWith('/tim-kiem?q=lai');
  });
});
