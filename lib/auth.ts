import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'lk_admin';
const COOKIE_VALUE = 'lowkeypedia-admin-v1';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('ADMIN_SECRET chưa được cấu hình');
  return s;
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

/** So sánh mật khẩu bằng hash + timingSafeEqual để tránh timing attack. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD chưa được cấu hình');
  const a = createHash('sha256').update(input, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseCookie(raw: string | undefined): boolean {
  if (!raw) return false;
  const [value, sig] = raw.split('.');
  if (!value || !sig || value !== COOKIE_VALUE) return false;
  const expected = sign(value);
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
  const sig = sign(COOKIE_VALUE);
  cookies().set(COOKIE_NAME, `${COOKIE_VALUE}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS,
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
