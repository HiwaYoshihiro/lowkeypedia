import { describe, expect, it } from 'vitest';
import { firstParam, stripMarkdown } from '@/lib/params';

describe('firstParam', () => {
  it('trả nguyên chuỗi khi searchParam là vô hướng', () => {
    expect(firstParam('a')).toBe('a');
  });

  it('lấy phần tử đầu khi searchParam lặp lại', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
  });

  it('trả chuỗi rỗng khi thiếu tham số', () => {
    expect(firstParam(undefined)).toBe('');
  });
});

describe('stripMarkdown', () => {
  it('bỏ **in đậm** và gộp khoảng trắng', () => {
    expect(stripMarkdown('**Vô địch**  AIC  \n 2025')).toBe('Vô địch AIC 2025');
  });

  it('cắt đúng 160 ký tự mặc định', () => {
    expect(stripMarkdown('x'.repeat(200))).toHaveLength(160);
  });

  it('trả chuỗi rỗng với dữ liệu không phải chuỗi', () => {
    expect(stripMarkdown(123)).toBe('');
    expect(stripMarkdown(null)).toBe('');
    expect(stripMarkdown(undefined)).toBe('');
  });
});
