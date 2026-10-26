import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Header an toàn áp cho mọi route.
 *
 * - `X-Content-Type-Options` — không để trình duyệt tự đoán MIME (chặn biến file
 *   tải lên thành script).
 * - `X-Frame-Options: DENY` — chống clickjacking, đặc biệt cho khu vực /admin.
 * - `Referrer-Policy` — chỉ gửi origin làm referrer khi đi sang tên miền khác.
 * - `Permissions-Policy` — tắt các quyền thiết bị mà wiki không dùng.
 *
 * CSP được đặt trong `proxy.ts` (Next 16) để sinh nonce riêng cho từng request.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Máy có package-lock.json lạc ở thư mục người dùng nên Next đoán sai gốc dự án khi
  // trace file (cảnh báo "outside the current Git repository"). Ghim gốc về repo này.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
