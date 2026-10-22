import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigation = vi.hoisted(() => ({ pathname: '/', push: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));

import SiteChrome from '@/components/SiteChrome';

function renderChrome() {
  return render(
    <SiteChrome>
      <p>Nội dung chính</p>
    </SiteChrome>
  );
}

describe('SiteChrome', () => {
  beforeEach(() => {
    navigation.pathname = '/';
    navigation.push.mockClear();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('render 5 mục điều hướng đúng nhãn', () => {
    renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Điều hướng' });
    const labels = Array.from(nav.querySelectorAll('.nav-link-label')).map(
      (element) => element.textContent
    );

    expect(labels).toEqual(['Trang chủ', 'Tuyển thủ', 'Đội tuyển', 'Giải đấu', 'Tìm kiếm']);
    expect(nav.querySelectorAll('.nav-link')).toHaveLength(5);
  });

  it('đánh dấu route hiện tại bằng aria-current="page"', () => {
    navigation.pathname = '/tuyen-thu';
    renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Điều hướng' });
    const active = nav.querySelector('[aria-current="page"]');

    expect(active).toHaveTextContent('Tuyển thủ');
    expect(active).toHaveAttribute('href', '/tuyen-thu');
  });

  it('nút Mở menu bật sidebar và aria-expanded', async () => {
    const user = userEvent.setup();
    renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Điều hướng' });
    expect(nav).not.toHaveClass('is-open');

    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(nav).toHaveClass('is-open');
    expect(within(nav).getByRole('button', { name: 'Đóng menu' })).toBeInTheDocument();
  });

  it('có skip-link tới nội dung chính', () => {
    renderChrome();

    expect(screen.getByRole('link', { name: 'Tới nội dung chính' })).toHaveAttribute(
      'href',
      '#noi-dung'
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'noi-dung');
    expect(screen.getByText('Nội dung chính')).toBeInTheDocument();
  });

  it('bấm scrim hoặc nút đóng đều đóng sidebar', async () => {
    const user = userEvent.setup();
    const { container } = renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Điều hướng' });
    const toggle = screen.getByRole('button', { name: 'Mở menu' });

    await user.click(toggle);
    const scrim = container.querySelector('.sidebar-scrim');
    expect(scrim).not.toBeNull();
    await user.click(scrim as Element);
    expect(nav).not.toHaveClass('is-open');

    await user.click(toggle);
    await user.click(within(nav).getByRole('button', { name: 'Đóng menu' }));
    expect(nav).not.toHaveClass('is-open');
  });

  it('cuộn xuống thì hiện nút lên đầu trang và bấm thì cuộn mượt về đỉnh', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { value: 700, configurable: true });

    try {
      renderChrome();

      const button = screen.getByRole('button', { name: 'Lên đầu trang' });
      await user.click(button);

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    } finally {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
      scrollTo.mockRestore();
    }
  });
});
