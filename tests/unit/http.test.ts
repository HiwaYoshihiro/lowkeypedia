// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { failure } from '@/lib/http';
import { ValidationError } from '@/lib/store';

describe('failure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trả 400 kèm thông báo cụ thể cho ValidationError', async () => {
    const res = failure(new ValidationError('Vị trí (role) không hợp lệ'), 'Lưu thất bại');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Vị trí (role) không hợp lệ' });
  });

  it('trả 500 với thông báo chung cho lỗi không xác định', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = failure(new Error('chi tiết nội bộ'), 'Lưu thất bại');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Lưu thất bại' });
    expect(spy).toHaveBeenCalled();
  });

  it('không rò rỉ chi tiết lỗi nội bộ ra response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = failure(new Error('BLOB_READ_WRITE_TOKEN chưa được cấu hình'), 'Lưu thất bại');
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('BLOB_READ_WRITE_TOKEN');
  });
});
