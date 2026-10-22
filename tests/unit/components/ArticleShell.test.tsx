import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleLayout, ArticleShell } from '@/components/ArticleShell';
import { Breadcrumb } from '@/components/Breadcrumb';

describe('ArticleShell', () => {
  it('render breadcrumb, tiêu đề, phụ đề, hành động và children', () => {
    render(
      <ArticleShell
        breadcrumb={
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Lai Bâng' }]} />
        }
        title="Lai Bâng"
        subtitle="Đi Rừng • Việt Nam"
        actions={<button type="button">Sửa</button>}
      >
        <p>Nội dung bài viết</p>
      </ArticleShell>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Lai Bâng' })).toBeInTheDocument();
    expect(screen.getByText('Đi Rừng • Việt Nam')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Đường dẫn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sửa' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung bài viết')).toBeInTheDocument();
  });

  it('không render khu vực phụ đề/hành động khi không truyền', () => {
    const { container } = render(
      <ArticleShell title="Trang">
        <div />
      </ArticleShell>
    );

    expect(container.querySelector('.article-subtitle')).toBeNull();
    expect(container.querySelector('.article-actions')).toBeNull();
  });
});

describe('ArticleLayout', () => {
  it('tách nội dung chính và infobox', () => {
    const { container } = render(
      <ArticleLayout infobox={<aside>Hộp thông tin</aside>}>
        <p>Nội dung</p>
      </ArticleLayout>
    );

    expect(container.querySelector('.article-body')).toHaveTextContent('Nội dung');
    expect(screen.getByText('Hộp thông tin')).toBeInTheDocument();
  });
});
