// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock('next/cache', () => ({ revalidatePath: cache.revalidatePath }));

import { revalidateSite } from '@/lib/revalidate';

describe('revalidateSite', () => {
  beforeEach(() => {
    cache.revalidatePath.mockClear();
  });

  it('revalidate toàn site bằng một lần gọi layout gốc', () => {
    revalidateSite();
    expect(cache.revalidatePath).toHaveBeenCalledTimes(1);
    expect(cache.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
