import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Cấu hình Vitest cho unit test + component test.
 *
 * - `jsdom` để render component; các test phía server thêm
 *   `// @vitest-environment node` ở đầu file.
 * - `resolve.tsconfigPaths` đọc alias `@/*` từ `tsconfig.json`.
 * - Coverage chỉ tính code sản phẩm (`lib/`, `components/`), không tính test.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.d.ts'],
      thresholds: {
        lines: 80,
        'lib/**/*.ts': { lines: 90 },
        'components/**/*.tsx': { lines: 80 },
      },
    },
  },
});
