'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ROLES, type Player, type Team } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Tab = 'players' | 'teams';

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
  achievements: string;
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
    achievements: '',
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
    achievements: p.achievements.join('\n'),
    avatarUrl: p.avatarUrl ?? '',
  };
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
    achievements: f.achievements,
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
  achievements: string;
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
    achievements: '',
    updatedAt: '',
  };
}

function teamToForm(t: Team): TeamFormState {
  return {
    ...t,
    logoUrl: t.logoUrl ?? '',
    founded: t.founded ? String(t.founded) : '',
    achievements: t.achievements.join('\n'),
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
    achievements: f.achievements,
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<PlayerFormState | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pr, tr] = await Promise.all([fetch('/api/admin/players'), fetch('/api/admin/teams')]);
      if (pr.status === 401 || tr.status === 401) {
        router.push('/admin');
        return;
      }
      if (!pr.ok || !tr.ok) throw new Error('Không tải được dữ liệu');
      setPlayers(await pr.json());
      setTeams(await tr.json());
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
      ) : (
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
              <Field label="Thành tích (mỗi dòng một thành tích)">
                <textarea className={inputCls} rows={4} value={editingPlayer.achievements} onChange={(e) => setEditingPlayer({ ...editingPlayer, achievements: e.target.value })} placeholder={'Vô địch AWC 2019\nVô địch AIC 2019'} />
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
              <Field label="Thành tích (mỗi dòng một thành tích)">
                <textarea className={inputCls} rows={4} value={editingTeam.achievements} onChange={(e) => setEditingTeam({ ...editingTeam, achievements: e.target.value })} placeholder={'Vô địch AWC 2019\nVô địch AIC 2019'} />
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
    </div>
  );
}
