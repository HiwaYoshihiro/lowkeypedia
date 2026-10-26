import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPlayers, savePlayer } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getPlayers());
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body.ign !== 'string' || !body.ign.trim()) {
      return NextResponse.json({ error: 'Thiếu tên thi đấu (ign)' }, { status: 400 });
    }
    const player = await savePlayer(body);
    revalidateSite();
    return NextResponse.json(player, { status: 201 });
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}