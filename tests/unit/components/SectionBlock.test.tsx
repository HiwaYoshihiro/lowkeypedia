import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionBlock } from '@/components/SectionBlock';

describe('SectionBlock', () => {
  it('render tiêu đề, số lượng, link xem tất cả và children', () => {
    render(
      <SectionBlock title="Tuyển thủ nổi bật" href="/tuyen-thu" accent="#3366cc" count={8}>
        <p>Nội dung bên trong</p>
      </SectionBlock>
    );

    const heading = screen.getByRole('heading', { name: /Tuyển thủ nổi bật/ });
    expect(heading).toHaveTextContent('(8)');
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute(
      'href',
      '/tuyen-thu'
    );
    expect(screen.getByText('Nội dung bên trong')).toBeInTheDocument();
  });

  it('không hiện số lượng khi count không phải số', () => {
    render(
      <SectionBlock title="Giải đấu" href="/giai-dau" accent="#b32424">
        <div />
      </SectionBlock>
    );

    expect(screen.getByRole('heading', { name: 'Giải đấu' })).toBeInTheDocument();
  });
});
