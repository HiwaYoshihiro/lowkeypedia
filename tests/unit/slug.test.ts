import { describe, expect, it } from 'vitest';
import { normalizeSearch, slugify } from '@/lib/slug';

describe('slugify', () => {
  it('bỏ dấu tiếng Việt và nối bằng gạch ngang', () => {
    expect(slugify('Lai Bâng')).toBe('lai-bang');
  });

  it('gộp khoảng trắng thừa và cắt hai đầu', () => {
    expect(slugify('  Đấu Trường   Danh Vọng ')).toBe('dau-truong-danh-vong');
  });

  // Hành vi hiện tại: ký tự không hợp lệ bị BỎ (không thay bằng gạch ngang),
  // nên 'A&B' thành 'ab'. Test ghim lại để nâng cấp không âm thầm đổi slug.
  it('bỏ ký tự đặc biệt thay vì thay bằng gạch ngang', () => {
    expect(slugify('A&B (2025)')).toBe('ab-2025');
  });

  it('trả chuỗi rỗng với input rỗng hoặc toàn ký tự đặc biệt', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!! ???')).toBe('');
  });
});

describe('normalizeSearch', () => {
  it('bỏ dấu để tìm không dấu', () => {
    expect(normalizeSearch('Lai Bâng')).toBe('lai bang');
  });

  it('bỏ dấu chữ đ', () => {
    expect(normalizeSearch('ĐTDV')).toBe('dtdv');
  });

  it('giữ nguyên chữ số và dấu cách', () => {
    expect(normalizeSearch('AIC 2025')).toBe('aic 2025');
  });
});
