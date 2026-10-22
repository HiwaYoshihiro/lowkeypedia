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
});
