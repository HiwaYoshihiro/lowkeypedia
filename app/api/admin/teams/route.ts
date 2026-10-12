import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getTeams, saveTeam } from '@/lib/store';

function revalidateTeamPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/doi-tuyen');
  revalidatePath('/tuyen-thu');
  revalidatePath('/tim-kiem');
}

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getTeams());
}

export async function POST(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên đội (name)' }, { status: 400 });
    }
    const team = await saveTeam(body);
    revalidateTeamPages();
    return NextResponse.json(team, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lưu thất bại' },
      { status: 500 }
    );
  }
}
