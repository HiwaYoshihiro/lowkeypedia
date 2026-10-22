import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import RichText, { renderRichText } from '@/components/RichText';

describe('RichText', () => {
  it('đổi **chữ** thành <strong>', () => {
    const { container } = render(<RichText text="Đội **vô địch** AIC" />);

    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent('vô địch');
    expect(container.textContent).toBe('Đội vô địch AIC');
  });

  it('giữ nguyên văn bản không có cú pháp', () => {
    const { container } = render(<RichText text="Một đoạn văn bình thường." />);
    expect(container.textContent).toBe('Một đoạn văn bình thường.');
  });

  it('escape HTML để không chèn được thẻ', () => {
    const { container } = render(<RichText text={'<img src=x onerror="alert(1)">'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('p')?.innerHTML).toContain('&lt;img');
  });

  it('render rỗng không crash', () => {
    const { container } = render(<RichText text="" />);
    expect(container.querySelector('p')).toBeEmptyDOMElement();
  });

  it('renderRichText chỉ cho phép thẻ strong', () => {
    expect(renderRichText('**đậm** <b>thường</b>')).toBe(
      '<strong>đậm</strong> &lt;b&gt;thường&lt;/b&gt;'
    );
  });
});
