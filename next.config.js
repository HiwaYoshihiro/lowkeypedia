/**
 * Header an toàn áp cho mọi route.
 *
 * - `X-Content-Type-Options` — không để trình duyệt tự đoán MIME (chặn biến file
 *   tải lên thành script).
 * - `X-Frame-Options: DENY` — chống clickjacking, đặc biệt cho khu vực /admin.
 * - `Referrer-Policy` — chỉ gửi origin làm referrer khi đi sang tên miền khác.
 * - `Permissions-Policy` — tắt các quyền thiết bị mà wiki không dùng.
 *
 * Chưa đặt CSP vì Next.js chèn script inline (theme, hydration); muốn bật cần
 * nonce/hash — xem ghi chú trong README.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
