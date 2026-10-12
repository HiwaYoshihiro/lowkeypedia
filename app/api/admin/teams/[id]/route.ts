import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { deleteTeam, getTeams, saveTeam } from '@/lib/store';

function revalidateTeamPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/doi-tuyen');
  revalidatePath('/tuyen-thu');
  revalidatePath('/tim-kiem');
}

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
    revalidateTeamPages();
    return NextResponse.json(team);
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
    const ok = await deleteTeam(params.id);
    if (!ok) return NextResponse.json({ error: 'Không tìm thấy đội tuyển' }, { status: 404 });
    revalidateTeamPages();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Xoá thất bại' },
      { status: 500 }
    );
  }
}
