import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Next.js chạy `lib/store.ts` dưới điều kiện `react-server`, nơi `cache()`
 * tồn tại; `react@18` bản thường (mà Vitest nạp) không export `cache`.
 * Ngoài một lượt render RSC thì `cache()` chỉ là hàm đồng nhất, nên shim
 * đúng hành vi đó để test import được store mà không cần runtime Next.
 */
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
  };
});

afterEach(() => {
  cleanup();
});
