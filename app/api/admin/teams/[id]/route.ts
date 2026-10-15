import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteTeam, getTeams, saveTeam } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const exists = (await getTeams()).some((t) => t.id === params.id);
    if (!exists) return NextResponse.json({ error: 'Không tìm thấy đội tuyển' }, { status: 404 });
    const body = await req.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên đội (name)' }, { status: 400 });
    }
    const team = await saveTeam({ ...body, id: params.id });
    revalidateSite();
    return NextResponse.json(team);
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const ok = await deleteTeam(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy đội tuyển' }, { status: 404 });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e, 'Xoá thất bại');
  }
}
