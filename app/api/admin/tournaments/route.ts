import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getTournaments, saveTournament } from '@/lib/store';

function revalidateTournamentPages() {
  revalidatePath('/', 'layout');
  revalidatePath('/giai-dau');
  revalidatePath('/tim-kiem');
}

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
    revalidateTournamentPages();
    return NextResponse.json(tournament, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lưu thất bại' },
      { status: 500 }
    );
  }
}
