import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'lk_admin';
const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000; // 7 ngày
const MIN_SECRET_LEN = 16;

function getSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('ADMIN_SECRET chưa được cấu hình');
  if (s.length < MIN_SECRET_LEN) {
    console.warn(
      `[lwkypedia] ADMIN_SECRET chỉ dài ${s.length} ký tự — nên dùng chuỗi ngẫu nhiên ≥ ${MIN_SECRET_LEN} ký tự`
    );
  }
  return s;
}

/**
 * Khoá ký cookie = HMAC(ADMIN_SECRET, ADMIN_PASSWORD).
 *
 * Nhờ trộn thêm mật khẩu vào khoá nên:
 * - Đổi `ADMIN_PASSWORD` sẽ vô hiệu hoá mọi phiên quản trị đang có.
 * - Kẻ tấn công không thể dò `ADMIN_SECRET` chỉ từ một payload công khai.
 */
function signingKey(): string {
  return createHmac('sha256', getSecret()).update(process.env.ADMIN_PASSWORD ?? '').digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('hex');
}

/** So sánh mật khẩu bằng hash + timingSafeEqual để tránh timing attack. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD chưa được cấu hình');
  const a = createHash('sha256').update(input, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Cookie có dạng `sid.exp.sig`:
 * - `sid` — 16 byte ngẫu nhiên (hex): mỗi phiên một giá trị, không đoán được.
 * - `exp` — thời điểm hết hạn (epoch ms).
 * - `sig` — HMAC-SHA256 của chuỗi `sid.exp`.
 *
 * Vì `exp` nằm trong phần được ký nên không thể kéo dài phiên bằng cách sửa cookie.
 * Bản cũ ký một hằng số công khai nên cookie có giá trị vĩnh viễn và giống nhau
 * ở mọi phiên.
 */
function parseCookie(raw: string | undefined): boolean {
  if (!raw) return false;
  const parts = raw.split('.');
  if (parts.length !== 3) return false;
  const [sid, exp, sig] = parts;
  if (!/^[0-9a-f]{32}$/.test(sid)) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs <= Date.now()) return false;
  const expected = sign(`${sid}.${exp}`);
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isAdmin(): boolean {
  try {
    return parseCookie(cookies().get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

export function setAdminCookie(): void {
  const sid = randomBytes(16).toString('hex');
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${sid}.${exp}`;
  cookies().set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearAdminCookie(): void {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Dùng trong API route handlers:
 *   const denied = requireAdmin();
 *   if (denied) return denied;
 */
export function requireAdmin(): Response | null {
  if (isAdmin()) return null;
  return Response.json({ error: 'Chưa đăng nhập quản trị' }, { status: 401 });
}
