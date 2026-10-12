import { list, put } from '@vercel/blob';
import playersSeed from '../data/seed/players.json';
import teamsSeed from '../data/seed/teams.json';
import { normalizeSearch, slugify } from './slug';
import { ROLES, type Player, type Role, type SearchResult, type Team } from './types';

const PLAYERS_PATH = 'lowkeypedia/data/players.json';
const TEAMS_PATH = 'lowkeypedia/data/teams.json';
const PREFIX = 'lowkeypedia/data/';
const TTL_MS = 30_000;

type CacheEntry<T> = { data: T; at: number };
const cache: { players?: CacheEntry<Player[]>; teams?: CacheEntry<Team[]> } = {};

/** Xoá cache in-memory sau mỗi lần ghi. */
export function clearCache(): void {
  delete cache.players;
  delete cache.teams;
}

function hasToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Đọc 1 file JSON từ Vercel Blob.
 * - Nếu chưa có token (chạy local chưa cấu hình): dùng seed kèm cảnh báo.
 * - Nếu file chưa tồn tại (list rỗng / fetch 404): PUT seed lên Blob rồi trả về seed.
 * - Lỗi mạng/Blob bất ngờ: fallback về seed để trang vẫn hiển thị được.
 */
async function readJsonFile<T>(path: string, seed: T): Promise<T> {
  if (!hasToken()) {
    console.warn(`[lowkeypedia] BLOB_READ_WRITE_TOKEN chưa có — dùng dữ liệu seed cho ${path}`);
    return seed;
  }
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const blob = blobs.find((b) => b.pathname === path);
    if (blob) {
      const res = await fetch(blob.url, { cache: 'no-store' });
      if (res.ok) return (await res.json()) as T;
      console.warn(`[lowkeypedia] fetch ${path} -> HTTP ${res.status}, sẽ seed lại file`);
    }
    await put(path, JSON.stringify(seed), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.warn(`[lowkeypedia] đã seed ${path} lên Blob`);
    return seed;
  } catch (err) {
    console.warn(`[lowkeypedia] lỗi đọc Blob (${path}), dùng seed:`, err);
    return seed;
  }
}

async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  if (!hasToken()) {
    throw new Error('BLOB_READ_WRITE_TOKEN chưa được cấu hình — không thể lưu dữ liệu');
  }
  await put(path, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  clearCache();
}

async function getPlayersRaw(): Promise<Player[]> {
  const hit = cache.players;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await readJsonFile<Player[]>(PLAYERS_PATH, playersSeed as Player[]);
  cache.players = { data, at: Date.now() };
  return data;
}

async function getTeamsRaw(): Promise<Team[]> {
  const hit = cache.teams;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await readJsonFile<Team[]>(TEAMS_PATH, teamsSeed as Team[]);
  cache.teams = { data, at: Date.now() };
  return data;
}

// ---------- Đọc ----------

export async function getPlayers(): Promise<Player[]> {
  const players = await getPlayersRaw();
  return [...players].sort((a, b) => a.ign.localeCompare(b.ign, 'vi'));
}

export async function getTeams(): Promise<Team[]> {
  const teams = await getTeamsRaw();
  return [...teams].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  return (await getPlayersRaw()).find((p) => p.slug === slug) ?? null;
}

export async function getTeamBySlug(slug: string): Promise<Team | null> {
  return (await getTeamsRaw()).find((t) => t.slug === slug) ?? null;
}

export async function getPlayersByTeam(teamSlug: string): Promise<Player[]> {
  return (await getPlayersRaw()).filter((p) => p.teamSlug === teamSlug);
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  const nq = normalizeSearch(q.trim());
  if (!nq) return [];
  const [players, teams] = await Promise.all([getPlayersRaw(), getTeamsRaw()]);
  const results: SearchResult[] = [];
  for (const p of players) {
    const hay = normalizeSearch([p.ign, p.realName ?? '', p.role].join(' '));
    if (hay.includes(nq)) {
      results.push({
        type: 'player',
        slug: p.slug,
        title: p.ign,
        subtitle: `${p.role}${p.realName ? ` • ${p.realName}` : ''}`,
      });
    }
  }
  for (const t of teams) {
    const hay = normalizeSearch([t.name, t.tag, t.region].join(' '));
    if (hay.includes(nq)) {
      results.push({
        type: 'team',
        slug: t.slug,
        title: t.name,
        subtitle: `${t.tag} • ${t.region}`,
      });
    }
  }
  return results;
}

// ---------- Ghi ----------

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || 'untitled';
  let i = 2;
  while (taken.has(slug)) slug = `${base}-${i++}`;
  return slug;
}

function cleanList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split('\n').map((x) => x.trim()).filter(Boolean);
  return [];
}

export async function savePlayer(input: Partial<Player> & { ign: string }): Promise<Player> {
  if (!ROLES.includes(input.role as Role)) throw new Error('Vị trí (role) không hợp lệ');
  const players = await getPlayersRaw();
  const now = new Date().toISOString();
  const id = input.id?.trim() || `player-${Date.now()}`;
  const taken = new Set(players.filter((p) => p.id !== id).map((p) => p.slug));
  const slug = uniqueSlug((input.slug || '').trim() || slugify(input.ign), taken);
  const player: Player = {
    id,
    slug,
    ign: input.ign.trim(),
    realName: input.realName?.trim() || undefined,
    role: input.role as Role,
    teamSlug: input.teamSlug?.trim() || null,
    nationality: input.nationality?.trim() || 'Việt Nam',
    birthYear: typeof input.birthYear === 'number' ? input.birthYear : undefined,
    biography: (input.biography || '').trim(),
    careerHistory: (input.careerHistory || '').trim(),
    achievements: cleanList(input.achievements),
    avatarUrl: input.avatarUrl?.trim() || undefined,
    updatedAt: now,
  };
  const idx = players.findIndex((p) => p.id === id);
  const next = idx >= 0 ? players.map((p, j) => (j === idx ? player : p)) : [...players, player];
  await writeJsonFile(PLAYERS_PATH, next);
  return player;
}

export async function deletePlayer(id: string): Promise<boolean> {
  const players = await getPlayersRaw();
  const next = players.filter((p) => p.id !== id);
  if (next.length === players.length) return false;
  await writeJsonFile(PLAYERS_PATH, next);
  return true;
}

export async function saveTeam(input: Partial<Team> & { name: string }): Promise<Team> {
  const teams = await getTeamsRaw();
  const now = new Date().toISOString();
  const id = input.id?.trim() || `team-${Date.now()}`;
  const taken = new Set(teams.filter((t) => t.id !== id).map((t) => t.slug));
  const slug = uniqueSlug((input.slug || '').trim() || slugify(input.name), taken);
  const team: Team = {
    id,
    slug,
    name: input.name.trim(),
    tag: (input.tag || '').trim().toUpperCase(),
    logoUrl: input.logoUrl?.trim() || undefined,
    region: input.region?.trim() || 'Việt Nam',
    founded: typeof input.founded === 'number' ? input.founded : undefined,
    description: (input.description || '').trim(),
    achievements: cleanList(input.achievements),
    updatedAt: now,
  };
  const idx = teams.findIndex((t) => t.id === id);
  const next = idx >= 0 ? teams.map((t, j) => (j === idx ? team : t)) : [...teams, team];
  await writeJsonFile(TEAMS_PATH, next);
  return team;
}

export async function deleteTeam(id: string): Promise<boolean> {
  const teams = await getTeamsRaw();
  const next = teams.filter((t) => t.id !== id);
  if (next.length === teams.length) return false;
  await writeJsonFile(TEAMS_PATH, next);
  return true;
}
