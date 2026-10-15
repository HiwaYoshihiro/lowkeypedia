import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteTournament, getTournaments, saveTournament } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const exists = (await getTournaments()).some((t) => t.id === params.id);
    if (!exists) return NextResponse.json({ error: 'Không tìm thấy giải đấu' }, { status: 404 });
    const body = await req.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên giải đấu (name)' }, { status: 400 });
    }
    const tournament = await saveTournament({ ...body, id: params.id });
    revalidateSite();
    return NextResponse.json(tournament);
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const ok = await deleteTournament(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy giải đấu' }, { status: 404 });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e, 'Xoá thất bại');
  }
}
