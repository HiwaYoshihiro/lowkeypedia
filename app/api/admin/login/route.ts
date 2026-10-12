import { NextResponse } from 'next/server';
import { setAdminCookie, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = (await req.json().catch(() => ({}))) as { password?: string };
    if (typeof password !== 'string' || !verifyPassword(password)) {
      return NextResponse.json({ error: 'Mật khẩu không đúng' }, { status: 401 });
    }
    setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi đăng nhập';
    const status = msg.includes('chưa được cấu hình') ? 500 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
