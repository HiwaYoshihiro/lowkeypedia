import { NextResponse, type NextRequest } from 'next/server';

/**
 * Content-Security-Policy theo nonce cho từng request (Next 16 đặt tên file là
 * `proxy.ts` — tên cũ `middleware.ts` không còn được nạp).
 *
 * Vì sao là nonce: `'unsafe-inline'` trong `script-src` làm CSP mất gần hết giá
 * trị, còn nonce cho phép chạy đúng các thẻ `<script>` do server sinh ra và chặn
 * mọi script lạ được chèn vào HTML.
 *
 * Next đọc header `Content-Security-Policy` trên *request* để tự gắn nonce vào
 * các thẻ script của framework; ta đặt cả trên request (cho Next) và trên
 * response (cho trình duyệt). Script nội tuyến duy nhất còn lại là JSON-LD —
 * đó là dữ liệu cho máy tìm kiếm, không phải mã chạy.
 */

const isDev = process.env.NODE_ENV !== 'production';

function buildCsp(nonce: string): string {
  // Chế độ dev của Next dùng eval (HMR, React Refresh) nên CSP phải nới hơn.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https:`;

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind/Next chèn một ít CSS nội tuyến (critical CSS, style của component).
    "style-src 'self' 'unsafe-inline'",
    // Ảnh trong dữ liệu wiki có thể trỏ ra ngoài (CDN ảnh đội/tuyển thủ).
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // `connect-src` cho fetch nội bộ; dev cần websocket của HMR.
    `connect-src 'self' https:${isDev ? ' ws: wss:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  // Chỉ bật khi chạy https thật, nếu không sẽ phá dev trên http://localhost.
  if (!isDev) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  /**
   * Bỏ qua tài nguyên tĩnh: chúng không render HTML nên không cần CSP, và chạy
   * proxy cho mỗi tệp tĩnh chỉ tốn thời gian.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|theme-init.js).*)'],
};
