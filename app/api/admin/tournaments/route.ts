import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getTournaments, saveTournament } from '@/lib/store';
import { revalidateSite } from '@/lib/revalidate';
import { failure } from '@/lib/http';

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getTournaments());
}

export async function POST(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Thiếu tên giải đấu (name)' }, { status: 400 });
    }
    const tournament = await saveTournament(body);
    revalidateSite();
    return NextResponse.json(tournament, { status: 201 });
  } catch (e) {
    return failure(e, 'Lưu thất bại');
  }
}
