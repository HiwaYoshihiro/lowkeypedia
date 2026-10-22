import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/Breadcrumb';

describe('Breadcrumb', () => {
  const items = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tuyển thủ', href: '/tuyen-thu' },
    { label: 'Lai Bâng' },
  ];

  it('item có href là link, item cuối không phải link', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Tuyển thủ' })).toHaveAttribute(
      'href',
      '/tuyen-thu'
    );
    expect(screen.queryByRole('link', { name: 'Lai Bâng' })).toBeNull();
    expect(screen.getByText('Lai Bâng')).toHaveAttribute('aria-current', 'page');
  });

  it('có nhãn điều hướng và dấu phân cách giữa các mục', () => {
    const { container } = render(<Breadcrumb items={items} />);

    expect(screen.getByRole('navigation', { name: 'Đường dẫn' })).toBeInTheDocument();
    expect(container.querySelectorAll('.breadcrumb-sep')).toHaveLength(items.length - 1);
  });
});
