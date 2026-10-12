import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { deleteTournament, getTournaments, saveTournament } from '@/lib/store';

function revalidateTournamentPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/giai-dau');
  revalidatePath('/tim-kiem');
}

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
    revalidateTournamentPages();
    return NextResponse.json(tournament);
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
    const ok = await deleteTournament(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy giải đấu' }, { status: 404 });
    revalidateTournamentPages();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Xoá thất bại' },
      { status: 500 }
    );
  }
}
