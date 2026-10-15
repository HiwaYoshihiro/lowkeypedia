import { NextResponse } from 'next/server';
import { setAdminCookie, verifyPassword } from '@/lib/auth';
import { clientIp, isRateLimited, noteFailure, noteSuccess } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.' },
      { status: 429 }
    );
  }

  try {
    const { password } = (await req.json().catch(() => ({}))) as { password?: string };
    if (typeof password !== 'string' || !verifyPassword(password)) {
      noteFailure(ip);
      return NextResponse.json({ error: 'Mật khẩu không đúng' }, { status: 401 });
    }
    noteSuccess(ip);
    setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Không lộ chi tiết cấu hình ra ngoài; log phía server để chẩn đoán.
    console.error('[lwkypedia] lỗi đăng nhập:', e);
    return NextResponse.json({ error: 'Không đăng nhập được' }, { status: 500 });
  }
}
