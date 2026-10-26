import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getTeams, saveTeam } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getTeams());
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên đội (name)' }, { status: 400 });
    }
    const team = await saveTeam(body);
    revalidateSite();
    return NextResponse.json(team, { status: 201 });
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}
