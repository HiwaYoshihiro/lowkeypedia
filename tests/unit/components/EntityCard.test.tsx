import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntityCard } from '@/components/EntityCard';

describe('EntityCard', () => {
  it('là link tới href với tiêu đề, phụ đề, meta và badge', () => {
    render(
      <EntityCard
        href="/tuyen-thu/lai-bang"
        title="Lai Bâng"
        subtitle="Nguyễn Văn A"
        meta="Đi Rừng"
        badge={<span>Saigon Phantom</span>}
        accent="#3366cc"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tuyen-thu/lai-bang');
    expect(link.style.getPropertyValue('--card-accent')).toBe('#3366cc');
    expect(screen.getByText('Lai Bâng')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Đi Rừng')).toBeInTheDocument();
    expect(screen.getByText('Saigon Phantom')).toBeInTheDocument();
  });

  it('không có ảnh thì hiện chữ cái đầu của initial', () => {
    const { container } = render(
      <EntityCard href="/x" title="Lai Bâng" accent="#000" initial="lai" />
    );

    expect(container.querySelector('.card-initial')).toHaveTextContent('L');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('có ảnh thì render img với alt rỗng (trang trí)', () => {
    const { container } = render(
      <EntityCard
        href="/x"
        title="Lai Bâng"
        accent="#000"
        imageUrl="/images/lai-bang.png"
      />
    );

    // alt="" nên ảnh mang role presentation, không truy vấn được bằng role img.
    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('src', '/images/lai-bang.png');
    expect(image).toHaveAttribute('alt', '');
  });
});
