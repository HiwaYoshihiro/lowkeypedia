import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('hiện thương hiệu LWKYPEDIA', () => {
    render(<Footer />);

    expect(screen.getByText('LWKY')).toBeInTheDocument();
    expect(screen.getByText('PEDIA')).toBeInTheDocument();
  });

  it('có ghi chú bách khoa mở do cộng đồng đóng góp', () => {
    render(<Footer />);

    expect(
      screen.getByText(/Bách khoa toàn thư mở về Liên Quân Mobile Việt Nam/)
    ).toHaveTextContent('Dữ liệu do cộng đồng đóng góp.');
  });

  it('có đủ liên kết chân trang', () => {
    render(<Footer />);

    const nav = screen.getByRole('navigation', { name: 'Liên kết chân trang' });
    const links = withinNav(nav);
    expect(links.map((link) => link.textContent)).toEqual([
      'Tuyển thủ',
      'Đội tuyển',
      'Giải đấu',
      'Tìm kiếm',
      'Quản trị',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/tuyen-thu',
      '/doi-tuyen',
      '/giai-dau',
      '/tim-kiem',
      '/admin',
    ]);
  });
});

function withinNav(nav: HTMLElement): HTMLAnchorElement[] {
  return Array.from(nav.querySelectorAll('a'));
}
