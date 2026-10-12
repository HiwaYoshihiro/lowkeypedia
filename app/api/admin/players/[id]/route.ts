import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { deletePlayer, getPlayers, savePlayer } from '@/lib/store';

function revalidatePlayerPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/tuyen-thu');
  revalidatePath('/tim-kiem');
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const exists = (await getPlayers()).some((p) => p.id === params.id);
    if (!exists) return NextResponse.json({ error: 'Không tìm thấy tuyển thủ' }, { status: 404 });
    const body = await req.json();
    if (!body || typeof body.ign !== 'string' || !body.ign.trim()) {
      return NextResponse.json({ error: 'Thiếu tên thi đấu (ign)' }, { status: 400 });
    }
    const player = await savePlayer({ ...body, id: params.id });
    revalidatePlayerPages();
    return NextResponse.json(player);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lưu thất bại' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const ok = await deletePlayer(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy tuyển thủ' }, { status: 404 });
    revalidatePlayerPages();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Xoá thất bại' },
      { status: 500 }
    );
  }
}
