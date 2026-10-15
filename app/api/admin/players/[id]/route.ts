import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deletePlayer, getPlayers, savePlayer } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

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
    revalidateSite();
    return NextResponse.json(player);
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const ok = await deletePlayer(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy tuyển thủ' }, { status: 404 });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e, 'Xoá thất bại');
  }
}