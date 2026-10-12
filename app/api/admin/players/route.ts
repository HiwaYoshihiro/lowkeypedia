import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getPlayers, savePlayer } from '@/lib/store';

function revalidatePlayerPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/tuyen-thu');
  revalidatePath('/tim-kiem');
}

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getPlayers());
}

export async function POST(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body.ign !== 'string' || !body.ign.trim()) {
      return NextResponse.json({ error: 'Thiếu tên thi đấu (ign)' }, { status: 400 });
    }
    const player = await savePlayer(body);
    revalidatePlayerPages();
    return NextResponse.json(player, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lưu thất bại' },
      { status: 500 }
    );
  }
}
