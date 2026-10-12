'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ROLES, type Achievement, type Player, type Team, type TeamHistoryItem, type Tournament } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Tab = 'players' | 'teams' | 'tournaments';

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wiki-blue';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/** Một dòng trong editor thành tích kiểu Liquipedia. */
interface AchievementRow {
  year: string;
  placement: string;
  tournament: string;
  tournamentSlug: string;
}

/** Một dòng trong editor lịch sử đội tuyển. */
interface TeamHistoryRow {
  period: string;
  team: string;
  teamSlug: string;
}

function emptyAchievementRow(): AchievementRow {
  return { year: '', placement: '', tournament: '', tournamentSlug: '' };
}

function emptyTeamHistoryRow(): TeamHistoryRow {
  return { period: '', team: '', teamSlug: '' };
}

function achievementToRow(a: Achievement): AchievementRow {
  return {
    year: a.year ?? '',
    placement: a.placement ?? '',
    tournament: a.tournament ?? '',
    tournamentSlug: a.tournamentSlug ?? '',
  };
}

function teamHistoryToRow(h: TeamHistoryItem): TeamHistoryRow {
  return { period: h.period ?? '', team: h.team ?? '', teamSlug: h.teamSlug ?? '' };
}

/** Editor bảng thành tích: mỗi dòng Năm | Thứ hạng | Giải đấu | Link giải đấu. */
function AchievementEditor({
  rows,
  onChange,
  tournaments,
}: {
  rows: AchievementRow[];
  onChange: (rows: AchievementRow[]) => void;
  tournaments: Tournament[];
}) {
  const setRow = (i: number, patch: Partial<AchievementRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
          <input
            className={`${inputCls} col-span-2`}
            placeholder="Năm"
            value={r.year}
            onChange={(e) => setRow(i, { year: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-3`}
            placeholder="Thứ hạng (Vô địch...)"
            value={r.placement}
            onChange={(e) => setRow(i, { placement: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-4`}
            placeholder="Giải đấu (AIC 2022...)"
            value={r.tournament}
            onChange={(e) => setRow(i, { tournament: e.target.value })}
          />
          <select
            className={`${inputCls} col-span-2`}
            value={r.tournamentSlug}
            onChange={(e) => setRow(i, { tournamentSlug: e.target.value })}
            title="Liên kết tới trang giải đấu"
          >
            <option value="">Không liên kết</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name.length > 24 ? t.name.slice(0, 24) + '…' : t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="col-span-1 text-red-600 hover:text-red-800 text-lg font-bold"
            title="Xoá dòng"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, emptyAchievementRow()])}
        className="text-sm text-wiki-blue hover:underline font-semibold"
      >
        + Thêm dòng thành tích
      </button>
    </div>
  );
}

/** Editor lịch sử đội tuyển: mỗi dòng Giai đoạn | Đội tuyển | Link đội. */
function TeamHistoryEditor({
  rows,
  onChange,
  teams,
}: {
  rows: TeamHistoryRow[];
  onChange: (rows: TeamHistoryRow[]) => void;
  teams: Team[];
}) {
  const setRow = (i: number, patch: Partial<TeamHistoryRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
          <input
            className={`${inputCls} col-span-3`}
            placeholder="Giai đoạn (2018–2022)"
            value={r.period}
            onChange={(e) => setRow(i, { period: e.target.value })}
          />
          <input
            className={`${inputCls} col-span-5`}
            placeholder="Đội tuyển"
            value={r.team}
            onChange={(e) => setRow(i, { team: e.target.value })}
          />
          <select
            className={`${inputCls} col-span-3`}
            value={r.teamSlug}
            onChange={(e) => {
              const name = teams.find((t) => t.slug === e.target.value)?.name ?? r.team;
              setRow(i, { teamSlug: e.target.value, team: e.target.value ? name : r.team });
            }}
            title="Liên kết tới trang đội tuyển"
          >
            <option value="">Không liên kết</option>
            {teams.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="col-span-1 text-red-600 hover:text-red-800 text-lg font-bold"
            title="Xoá dòng"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, emptyTeamHistoryRow()])}
        className="text-sm text-wiki-blue hover:underline font-semibold"
      >
        + Thêm giai đoạn
      </button>
    </div>
  );
}

interface PlayerFormState {
  id: string;
  slug: string;
  ign: string;
  realName: string;
  role: Player['role'];
  teamSlug: string;
  nationality: string;
  birthYear: string;
  biography: string;
  careerHistory: string;
  teamHistory: TeamHistoryRow[];
  achievements: AchievementRow[];
  avatarUrl: string;
  updatedAt: string;
}

function emptyPlayer(): PlayerFormState {
  return {
    id: '',
    slug: '',
    ign: '',
    realName: '',
    role: 'Đường Giữa',
    teamSlug: '',
    nationality: 'Việt Nam',
    birthYear: '',
    biography: '',
    careerHistory: '',
    teamHistory: [],
    achievements: [],
    avatarUrl: '',
    updatedAt: '',
  };
}

function playerToForm(p: Player): PlayerFormState {
  return {
    ...p,
    realName: p.realName ?? '',
    teamSlug: p.teamSlug ?? '',
    birthYear: p.birthYear ? String(p.birthYear) : '',
    teamHistory: (p.teamHistory ?? []).map(teamHistoryToRow),
    achievements: p.achievements.map(achievementToRow),
    avatarUrl: p.avatarUrl ?? '',
  };
}

/** Bỏ các dòng thành tích trống hoàn toàn trước khi gửi. */
function rowsToAchievements(rows: AchievementRow[]): Achievement[] {
  return rows
    .map((r) => ({
      year: r.year.trim(),
      placement: r.placement.trim(),
      tournament: r.tournament.trim(),
      ...(r.tournamentSlug ? { tournamentSlug: r.tournamentSlug } : {}),
    }))
    .filter((a) => a.year || a.placement || a.tournament);
}

function rowsToTeamHistory(rows: TeamHistoryRow[]): TeamHistoryItem[] | undefined {
  const out = rows
    .map((r) => ({
      period: r.period.trim(),
      team: r.team.trim(),
      ...(r.teamSlug ? { teamSlug: r.teamSlug } : {}),
    }))
    .filter((h) => h.period || h.team);
  return out.length > 0 ? out : undefined;
}

function formToPlayerPayload(f: PlayerFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    ign: f.ign.trim(),
    realName: f.realName.trim(),
    role: f.role,
    teamSlug: f.teamSlug.trim() || null,
    nationality: f.nationality.trim() || 'Việt Nam',
    birthYear: f.birthYear.trim() ? Number(f.birthYear.trim()) : undefined,
    biography: f.biography,
    careerHistory: f.careerHistory,
    teamHistory: rowsToTeamHistory(f.teamHistory),
    achievements: rowsToAchievements(f.achievements),
    avatarUrl: f.avatarUrl.trim(),
  };
}

interface TeamFormState {
  id: string;
  slug: string;
  name: string;
  tag: string;
  logoUrl: string;
  region: string;
  founded: string;
  description: string;
  achievements: AchievementRow[];
  updatedAt: string;
}

function emptyTeam(): TeamFormState {
  return {
    id: '',
    slug: '',
    name: '',
    tag: '',
    logoUrl: '',
    region: 'Việt Nam',
    founded: '',
    description: '',
    achievements: [],
    updatedAt: '',
  };
}

function teamToForm(t: Team): TeamFormState {
  return {
    ...t,
    logoUrl: t.logoUrl ?? '',
    founded: t.founded ? String(t.founded) : '',
    achievements: t.achievements.map(achievementToRow),
  };
}

function formToTeamPayload(f: TeamFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    name: f.name.trim(),
    tag: f.tag.trim(),
    logoUrl: f.logoUrl.trim(),
    region: f.region.trim() || 'Việt Nam',
    founded: f.founded.trim() ? Number(f.founded.trim()) : undefined,
    description: f.description,
    achievements: rowsToAchievements(f.achievements),
  };
}

interface TournamentFormState {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  frequency: string;
  location: string;
  description: string;
  results: string;
  updatedAt: string;
}

function emptyTournament(): TournamentFormState {
  return {
    id: '',
    slug: '',
    name: '',
    organizer: '',
    frequency: '',
    location: '',
    description: '',
    results: '',
    updatedAt: '',
  };
}

function tournamentToForm(t: Tournament): TournamentFormState {
  return {
    ...t,
    organizer: t.organizer ?? '',
    frequency: t.frequency ?? '',
    location: t.location ?? '',
    results: t.results.join('\n'),
  };
}

function formToTournamentPayload(f: TournamentFormState) {
  return {
    ...(f.id ? { id: f.id } : {}),
    slug: f.slug.trim(),
    name: f.name.trim(),
    organizer: f.organizer.trim(),
    frequency: f.frequency.trim(),
    location: f.location.trim(),
    description: f.description,
    results: f.results,
  };
}

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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pr, tr, tor] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/admin/teams'),
        fetch('/api/admin/tournaments'),
      ]);
      if (pr.status === 401 || tr.status === 401 || tor.status === 401) {
        router.push('/admin');
        return;
      }
      if (!pr.ok || !tr.ok || !tor.ok) throw new Error('Không tải được dữ liệu');
      setPlayers(await pr.json());
      setTeams(await tr.json());
      setTournaments(await tor.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

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
      await load();
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
    await load();
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
      await load();
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
    await load();
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
      await load();
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
    await load();
  }

  const teamNameOf = (slug: string | null) => teams.find((t) => t.slug === slug)?.name ?? '—';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wiki-darkblue">Bảng quản trị</h1>
        <button onClick={logout} className="text-sm text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50">
          Đăng xuất
        </button>
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
        <section className="mt-4">
          <button
            onClick={() => setEditingPlayer(emptyPlayer())}
            className="bg-wiki-blue hover:bg-wiki-darkblue text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Thêm tuyển thủ
          </button>
          <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2.5">IGN</th>
                  <th className="px-4 py-2.5">Vị trí</th>
                  <th className="px-4 py-2.5">Đội</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-wiki-darkblue">{p.ign}</td>
                    <td className="px-4 py-2.5">{p.role}</td>
                    <td className="px-4 py-2.5">{teamNameOf(p.teamSlug)}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditingPlayer(playerToForm(p))} className="text-wiki-blue hover:underline mr-3">
                        Sửa
                      </button>
                      <button onClick={() => deletePlayerById(p.id, p.ign)} className="text-red-600 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : tab === 'teams' ? (
        <section className="mt-4">
          <button
            onClick={() => setEditingTeam(emptyTeam())}
            className="bg-wiki-blue hover:bg-wiki-darkblue text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Thêm đội tuyển
          </button>
          <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2.5">Tên đội</th>
                  <th className="px-4 py-2.5">Tag</th>
                  <th className="px-4 py-2.5">Khu vực</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-wiki-darkblue">{t.name}</td>
                    <td className="px-4 py-2.5 font-mono">{t.tag}</td>
                    <td className="px-4 py-2.5">{t.region}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditingTeam(teamToForm(t))} className="text-wiki-blue hover:underline mr-3">
                        Sửa
                      </button>
                      <button onClick={() => deleteTeamById(t.id, t.name)} className="text-red-600 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-4">
          <button
            onClick={() => setEditingTournament(emptyTournament())}
            className="bg-wiki-blue hover:bg-wiki-darkblue text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Thêm giải đấu
          </button>
          <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2.5">Tên giải</th>
                  <th className="px-4 py-2.5">Ban tổ chức</th>
                  <th className="px-4 py-2.5">Tần suất</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-wiki-darkblue">{t.name}</td>
                    <td className="px-4 py-2.5">{t.organizer || '—'}</td>
                    <td className="px-4 py-2.5">{t.frequency || '—'}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditingTournament(tournamentToForm(t))} className="text-wiki-blue hover:underline mr-3">
                        Sửa
                      </button>
                      <button onClick={() => deleteTournamentById(t.id, t.name)} className="text-red-600 hover:underline">
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Form tuyển thủ */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl max-w-2xl mx-auto my-8 p-6">
            <h2 className="text-lg font-extrabold text-wiki-darkblue">
              {editingPlayer.id ? `Sửa tuyển thủ: ${editingPlayer.ign}` : 'Thêm tuyển thủ mới'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Tên thi đấu (IGN) *">
                <input className={inputCls} value={editingPlayer.ign} onChange={(e) => setEditingPlayer({ ...editingPlayer, ign: e.target.value })} />
              </Field>
              <Field label="Tên thật">
                <input className={inputCls} value={editingPlayer.realName} onChange={(e) => setEditingPlayer({ ...editingPlayer, realName: e.target.value })} />
              </Field>
              <Field label="Slug (bỏ trống để tự tạo)">
                <input className={inputCls} value={editingPlayer.slug} onChange={(e) => setEditingPlayer({ ...editingPlayer, slug: e.target.value })} placeholder="vd: lai-bang" />
              </Field>
              <Field label="Vị trí *">
                <select className={inputCls} value={editingPlayer.role} onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value as Player['role'] })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Đội hiện tại">
                <select className={inputCls} value={editingPlayer.teamSlug} onChange={(e) => setEditingPlayer({ ...editingPlayer, teamSlug: e.target.value })}>
                  <option value="">Tự do / đã giải nghệ</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quốc tịch">
                <input className={inputCls} value={editingPlayer.nationality} onChange={(e) => setEditingPlayer({ ...editingPlayer, nationality: e.target.value })} />
              </Field>
              <Field label="Năm sinh">
                <input className={inputCls} inputMode="numeric" value={editingPlayer.birthYear} onChange={(e) => setEditingPlayer({ ...editingPlayer, birthYear: e.target.value })} placeholder="vd: 2001" />
              </Field>
              <Field label="Ảnh đại diện (URL)">
                <input className={inputCls} value={editingPlayer.avatarUrl} onChange={(e) => setEditingPlayer({ ...editingPlayer, avatarUrl: e.target.value })} placeholder="https://..." />
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Tiểu sử">
                <textarea className={inputCls} rows={4} value={editingPlayer.biography} onChange={(e) => setEditingPlayer({ ...editingPlayer, biography: e.target.value })} />
              </Field>
              <Field label="Sự nghiệp">
                <textarea className={inputCls} rows={4} value={editingPlayer.careerHistory} onChange={(e) => setEditingPlayer({ ...editingPlayer, careerHistory: e.target.value })} />
              </Field>
              <Field label="Lịch sử đội tuyển">
                <TeamHistoryEditor
                  rows={editingPlayer.teamHistory}
                  onChange={(teamHistory) => setEditingPlayer({ ...editingPlayer, teamHistory })}
                  teams={teams}
                />
              </Field>
              <Field label="Thành tích thi đấu">
                <AchievementEditor
                  rows={editingPlayer.achievements}
                  onChange={(achievements) => setEditingPlayer({ ...editingPlayer, achievements })}
                  tournaments={tournaments}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingPlayer(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={savePlayerForm}
                disabled={saving}
                className="px-5 py-2 text-sm bg-wiki-blue hover:bg-wiki-darkblue disabled:opacity-60 text-white font-semibold rounded-lg"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form đội tuyển */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl max-w-2xl mx-auto my-8 p-6">
            <h2 className="text-lg font-extrabold text-wiki-darkblue">
              {editingTeam.id ? `Sửa đội tuyển: ${editingTeam.name}` : 'Thêm đội tuyển mới'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Tên đội *">
                <input className={inputCls} value={editingTeam.name} onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })} />
              </Field>
              <Field label="Tag">
                <input className={inputCls} value={editingTeam.tag} onChange={(e) => setEditingTeam({ ...editingTeam, tag: e.target.value })} placeholder="vd: SGP" />
              </Field>
              <Field label="Slug (bỏ trống để tự tạo)">
                <input className={inputCls} value={editingTeam.slug} onChange={(e) => setEditingTeam({ ...editingTeam, slug: e.target.value })} placeholder="vd: saigon-phantom" />
              </Field>
              <Field label="Khu vực">
                <input className={inputCls} value={editingTeam.region} onChange={(e) => setEditingTeam({ ...editingTeam, region: e.target.value })} />
              </Field>
              <Field label="Năm thành lập">
                <input className={inputCls} inputMode="numeric" value={editingTeam.founded} onChange={(e) => setEditingTeam({ ...editingTeam, founded: e.target.value })} placeholder="vd: 2017" />
              </Field>
              <Field label="Logo (URL)">
                <input className={inputCls} value={editingTeam.logoUrl} onChange={(e) => setEditingTeam({ ...editingTeam, logoUrl: e.target.value })} placeholder="https://..." />
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Mô tả">
                <textarea className={inputCls} rows={4} value={editingTeam.description} onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })} />
              </Field>
              <Field label="Thành tích đội tuyển">
                <AchievementEditor
                  rows={editingTeam.achievements}
                  onChange={(achievements) => setEditingTeam({ ...editingTeam, achievements })}
                  tournaments={tournaments}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTeam(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={saveTeamForm}
                disabled={saving}
                className="px-5 py-2 text-sm bg-wiki-blue hover:bg-wiki-darkblue disabled:opacity-60 text-white font-semibold rounded-lg"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form giải đấu */}
      {editingTournament && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl max-w-2xl mx-auto my-8 p-6">
            <h2 className="text-lg font-extrabold text-wiki-darkblue">
              {editingTournament.id ? `Sửa giải đấu: ${editingTournament.name}` : 'Thêm giải đấu mới'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Tên giải đấu *">
                <input className={inputCls} value={editingTournament.name} onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })} />
              </Field>
              <Field label="Slug (bỏ trống để tự tạo)">
                <input className={inputCls} value={editingTournament.slug} onChange={(e) => setEditingTournament({ ...editingTournament, slug: e.target.value })} placeholder="vd: dau-truong-danh-vong" />
              </Field>
              <Field label="Ban tổ chức">
                <input className={inputCls} value={editingTournament.organizer} onChange={(e) => setEditingTournament({ ...editingTournament, organizer: e.target.value })} placeholder="vd: Garena Việt Nam" />
              </Field>
              <Field label="Tần suất">
                <input className={inputCls} value={editingTournament.frequency} onChange={(e) => setEditingTournament({ ...editingTournament, frequency: e.target.value })} placeholder="vd: 2 mùa/năm" />
              </Field>
              <Field label="Khu vực / Địa điểm">
                <input className={inputCls} value={editingTournament.location} onChange={(e) => setEditingTournament({ ...editingTournament, location: e.target.value })} placeholder="vd: Việt Nam" />
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Giới thiệu">
                <textarea className={inputCls} rows={4} value={editingTournament.description} onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })} />
              </Field>
              <Field label="Lịch sử vô địch (mỗi dòng một mục)">
                <textarea className={inputCls} rows={5} value={editingTournament.results} onChange={(e) => setEditingTournament({ ...editingTournament, results: e.target.value })} placeholder={'2024 — Vô địch: Bacon Time\n2023 — Vô địch: Talon Esports'} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTournament(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={saveTournamentForm}
                disabled={saving}
                className="px-5 py-2 text-sm bg-wiki-blue hover:bg-wiki-darkblue disabled:opacity-60 text-white font-semibold rounded-lg"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
