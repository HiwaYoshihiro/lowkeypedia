'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Player, Team, Tournament } from '@/lib/types';
import AdminTable from './_components/AdminTable';
import PlayerForm, {
  emptyPlayer,
  formToPlayerPayload,
  playerToForm,
  type PlayerFormState,
} from './_components/PlayerForm';
import TeamForm, {
  emptyTeam,
  formToTeamPayload,
  teamToForm,
  type TeamFormState,
} from './_components/TeamForm';
import TournamentForm, {
  emptyTournament,
  formToTournamentPayload,
  tournamentToForm,
  type TournamentFormState,
} from './_components/TournamentForm';

type Tab = 'players' | 'teams' | 'tournaments';

interface DashboardData {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
}

/** Tải toàn bộ dữ liệu quản trị; trả `'unauthorized'` khi phiên admin đã hết hạn. */
async function loadDashboardData(): Promise<DashboardData | 'unauthorized'> {
  const [pr, tr, tor] = await Promise.all([
    fetch('/api/admin/players'),
    fetch('/api/admin/teams'),
    fetch('/api/admin/tournaments'),
  ]);
  if (pr.status === 401 || tr.status === 401 || tor.status === 401) return 'unauthorized';
  if (!pr.ok || !tr.ok || !tor.ok) throw new Error('Không tải được dữ liệu');
  return {
    players: (await pr.json()) as Player[],
    teams: (await tr.json()) as Team[],
    tournaments: (await tor.json()) as Tournament[],
  };
}

/**
 * Bảng quản trị: giữ state, tải dữ liệu, điều phối thao tác CRUD và khung tab.
 * Phần giao diện chi tiết nằm trong các component nhỏ ở `./_components`.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<PlayerFormState | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamFormState | null>(null);
  const [editingTournament, setEditingTournament] = useState<TournamentFormState | null>(null);
  const [saving, setSaving] = useState(false);

  // Nạp dữ liệu ban đầu trong effect: chỉ gắn callback của promise, không gọi
  // một hàm có setState ngay trong thân effect.
  useEffect(() => {
    let alive = true;
    loadDashboardData()
      .then((data) => {
        if (!alive) return;
        if (data === 'unauthorized') {
          router.push('/admin');
          return;
        }
        setPlayers(data.players);
        setTeams(data.teams);
        setTournaments(data.tournaments);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadDashboardData();
      if (data === 'unauthorized') {
        router.push('/admin');
        return;
      }
      setPlayers(data.players);
      setTeams(data.teams);
      setTournaments(data.tournaments);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  async function savePlayerForm() {
    if (!editingPlayer) return;
    if (!editingPlayer.ign.trim()) {
      setError('Vui lòng nhập tên thi đấu (IGN)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = formToPlayerPayload(editingPlayer);
      const isNew = !editingPlayer.id;
      const res = await fetch(isNew ? '/api/admin/players' : `/api/admin/players/${editingPlayer.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Lưu thất bại');
      }
      setEditingPlayer(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function deletePlayerById(id: string, ign: string) {
    if (!confirm(`Xoá tuyển thủ "${ign}"?`)) return;
    const res = await fetch(`/api/admin/players/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      router.push('/admin');
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Xoá thất bại');
      return;
    }
    await reload();
  }

  async function saveTeamForm() {
    if (!editingTeam) return;
    if (!editingTeam.name.trim()) {
      setError('Vui lòng nhập tên đội');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = formToTeamPayload(editingTeam);
      const isNew = !editingTeam.id;
      const res = await fetch(isNew ? '/api/admin/teams' : `/api/admin/teams/${editingTeam.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Lưu thất bại');
      }
      setEditingTeam(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeamById(id: string, name: string) {
    if (!confirm(`Xoá đội tuyển "${name}"?`)) return;
    const res = await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      router.push('/admin');
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Xoá thất bại');
      return;
    }
    await reload();
  }

  async function saveTournamentForm() {
    if (!editingTournament) return;
    if (!editingTournament.name.trim()) {
      setError('Vui lòng nhập tên giải đấu');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = formToTournamentPayload(editingTournament);
      const isNew = !editingTournament.id;
      const res = await fetch(
        isNew ? '/api/admin/tournaments' : `/api/admin/tournaments/${editingTournament.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Lưu thất bại');
      }
      setEditingTournament(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTournamentById(id: string, name: string) {
    if (!confirm(`Xoá giải đấu "${name}"?`)) return;
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      router.push('/admin');
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Xoá thất bại');
      return;
    }
    await reload();
  }

  const teamNameOf = (slug: string | null) => teams.find((t) => t.slug === slug)?.name ?? '—';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wiki-darkblue">Bảng quản trị</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export"
            title="Tải bản sao lưu JSON của toàn bộ dữ liệu wiki"
            className="text-sm text-wiki-blue border border-wiki-blue rounded-lg px-4 py-2 hover:bg-blue-50"
          >
            Xuất dữ liệu
          </a>
          <button
            onClick={logout}
            className="text-sm text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        {(
          [
            ['players', `Tuyển thủ (${players.length})`],
            ['teams', `Đội tuyển (${teams.length})`],
            ['tournaments', `Giải đấu (${tournaments.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
              tab === key ? 'border-wiki-blue text-wiki-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Đang tải...</p>
      ) : tab === 'players' ? (
        <AdminTable
          addLabel="+ Thêm tuyển thủ"
          onAdd={() => setEditingPlayer(emptyPlayer())}
          items={players}
          columns={[
            { header: 'IGN', className: 'font-semibold text-wiki-darkblue', render: (p) => p.ign },
            { header: 'Vị trí', render: (p) => p.role },
            { header: 'Đội', render: (p) => teamNameOf(p.teamSlug) },
          ]}
          onEdit={(p) => setEditingPlayer(playerToForm(p))}
          onDelete={(p) => deletePlayerById(p.id, p.ign)}
        />
      ) : tab === 'teams' ? (
        <AdminTable
          addLabel="+ Thêm đội tuyển"
          onAdd={() => setEditingTeam(emptyTeam())}
          items={teams}
          columns={[
            { header: 'Tên đội', className: 'font-semibold text-wiki-darkblue', render: (t) => t.name },
            { header: 'Tag', className: 'font-mono', render: (t) => t.tag },
            { header: 'Khu vực', render: (t) => t.region },
          ]}
          onEdit={(t) => setEditingTeam(teamToForm(t))}
          onDelete={(t) => deleteTeamById(t.id, t.name)}
        />
      ) : (
        <AdminTable
          addLabel="+ Thêm giải đấu"
          onAdd={() => setEditingTournament(emptyTournament())}
          items={tournaments}
          columns={[
            { header: 'Tên giải', className: 'font-semibold text-wiki-darkblue', render: (t) => t.name },
            { header: 'Ban tổ chức', render: (t) => t.organizer || '—' },
            { header: 'Tần suất', render: (t) => t.frequency || '—' },
          ]}
          onEdit={(t) => setEditingTournament(tournamentToForm(t))}
          onDelete={(t) => deleteTournamentById(t.id, t.name)}
        />
      )}

      {/* Form tuyển thủ */}
      {editingPlayer && (
        <PlayerForm
          form={editingPlayer}
          onChange={setEditingPlayer}
          onSave={savePlayerForm}
          onCancel={() => setEditingPlayer(null)}
          saving={saving}
          teams={teams}
          tournaments={tournaments}
        />
      )}

      {/* Form đội tuyển */}
      {editingTeam && (
        <TeamForm
          form={editingTeam}
          onChange={setEditingTeam}
          onSave={saveTeamForm}
          onCancel={() => setEditingTeam(null)}
          saving={saving}
          tournaments={tournaments}
        />
      )}

      {/* Form giải đấu */}
      {editingTournament && (
        <TournamentForm
          form={editingTournament}
          onChange={setEditingTournament}
          onSave={saveTournamentForm}
          onCancel={() => setEditingTournament(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
