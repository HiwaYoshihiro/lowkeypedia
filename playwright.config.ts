import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Nạp biến cho Blob test/admin nếu có; thiếu file thì dotenv bỏ qua im lặng.
dotenv.config({ path: '.env.test.local', quiet: true });

const hasAdminSecrets = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN_TEST &&
    process.env.ADMIN_PASSWORD_TEST &&
    process.env.ADMIN_SECRET_TEST
);

/** Biến môi trường cho hai server quản trị (chỉ dùng khi đã có secret test). */
const adminEnv: Record<string, string> = {
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN_TEST ?? '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD_TEST ?? '',
  ADMIN_SECRET: process.env.ADMIN_SECRET_TEST ?? '',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3100' },
      testMatch: /(?:public|details|search|theme|seo|404)\.spec\.ts/,
    },
    ...(hasAdminSecrets
      ? [
          {
            name: 'admin',
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3101' },
            testMatch: /admin\.spec\.ts/,
          },
          {
            name: 'admin-ratelimit',
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3102' },
            testMatch: /ratelimit\.spec\.ts/,
          },
        ]
      : []),
  ],
  webServer: [
    {
      command: 'npm run start -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // Server công khai phải chạy bằng seed, không bao giờ chạm Blob thật.
      env: { BLOB_READ_WRITE_TOKEN: '' },
    },
    ...(hasAdminSecrets
      ? [
          {
            command: 'npm run start -- -p 3101',
            url: 'http://localhost:3101',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: { ...adminEnv, LOGIN_RATE_LIMIT_MAX: '200' },
          },
          {
            command: 'npm run start -- -p 3102',
            url: 'http://localhost:3102',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: { ...adminEnv, LOGIN_RATE_LIMIT_MAX: '3' },
          },
        ]
      : []),
  ],
});
