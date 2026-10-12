import { list, put } from '@vercel/blob';
import playersSeed from '../data/seed/players.json';
import teamsSeed from '../data/seed/teams.json';
import tournamentsSeed from '../data/seed/tournaments.json';
import { normalizeSearch, slugify } from './slug';
import {
  ROLES,
  type Achievement,
  type Player,
  type Role,
  type SearchResult,
  type Team,
  type TeamHistoryItem,
  type Tournament,
} from './types';

const PLAYERS_PATH = 'lowkeypedia/data/players.json';
const TEAMS_PATH = 'lowkeypedia/data/teams.json';
const TOURNAMENTS_PATH = 'lowkeypedia/data/tournaments.json';
const PREFIX = 'lowkeypedia/data/';
const TTL_MS = 30_000;

type CacheEntry<T> = { data: T; at: number };
const cache: { players?: CacheEntry<Player[]>; teams?: CacheEntry<Team[]>; tournaments?: CacheEntry<Tournament[]> } = {};

/** Xoá cache in-memory sau mỗi lần ghi. */
export function clearCache(): void {
  delete cache.players;
  delete cache.teams;
  delete cache.tournaments;
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
      allowOverwrite: true,
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
    allowOverwrite: true,
    contentType: 'application/json',
  });
  clearCache();
}

async function getPlayersRaw(): Promise<Player[]> {
  const hit = cache.players;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await readJsonFile<Player[]>(PLAYERS_PATH, playersSeed as Player[]);
  const normalized = data.map(normalizePlayer);
  cache.players = { data: normalized, at: Date.now() };
  return normalized;
}

async function getTeamsRaw(): Promise<Team[]> {
  const hit = cache.teams;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await readJsonFile<Team[]>(TEAMS_PATH, teamsSeed as Team[]);
  const normalized = data.map(normalizeTeam);
  cache.teams = { data: normalized, at: Date.now() };
  return normalized;
}

async function getTournamentsRaw(): Promise<Tournament[]> {
  const hit = cache.tournaments;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await readJsonFile<Tournament[]>(TOURNAMENTS_PATH, tournamentsSeed as Tournament[]);
  cache.tournaments = { data, at: Date.now() };
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

export async function getTournaments(): Promise<Tournament[]> {
  const tournaments = await getTournamentsRaw();
  return [...tournaments].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  return (await getTournamentsRaw()).find((t) => t.slug === slug) ?? null;
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  const nq = normalizeSearch(q.trim());
  if (!nq) return [];
  const [players, teams, tournaments] = await Promise.all([
    getPlayersRaw(),
    getTeamsRaw(),
    getTournamentsRaw(),
  ]);
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
  for (const t of tournaments) {
    const hay = normalizeSearch([t.name, t.organizer, t.location].join(' '));
    if (hay.includes(nq)) {
      results.push({
        type: 'tournament',
        slug: t.slug,
        title: t.name,
        subtitle: `Giải đấu • ${t.organizer}`,
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

/** Chuẩn hoá 1 achievement: string cũ → object, object → trim từng field. Bỏ dòng trống hoàn toàn. */
function cleanAchievement(v: unknown): Achievement | null {
  if (typeof v === 'string') {
    const tournament = v.trim();
    if (!tournament) return null;
    return { year: '', placement: '', tournament };
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const year = String(o.year ?? '').trim();
    const placement = String(o.placement ?? '').trim();
    const tournament = String(o.tournament ?? '').trim();
    const tournamentSlug = String(o.tournamentSlug ?? '').trim() || undefined;
    if (!year && !placement && !tournament) return null;
    return { year, placement, tournament, ...(tournamentSlug ? { tournamentSlug } : {}) };
  }
  return null;
}

function cleanAchievements(v: unknown): Achievement[] {
  if (!Array.isArray(v)) return [];
  const out: Achievement[] = [];
  for (const item of v) {
    const a = cleanAchievement(item);
    if (a) out.push(a);
  }
  return out;
}

function cleanTeamHistory(v: unknown): TeamHistoryItem[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: TeamHistoryItem[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const period = String(o.period ?? '').trim();
    const team = String(o.team ?? '').trim();
    const teamSlug = String(o.teamSlug ?? '').trim() || undefined;
    if (!period && !team) continue;
    out.push({ period, team, ...(teamSlug ? { teamSlug } : {}) });
  }
  return out.length > 0 ? out : undefined;
}

/** Chuẩn hoá dữ liệu tuyển thủ đọc từ Blob: achievements string[] cũ → Achievement[]. */
function normalizePlayer(p: Player): Player {
  return {
    ...p,
    achievements: cleanAchievements(p.achievements as unknown),
    teamHistory: cleanTeamHistory(p.teamHistory),
  };
}

/** Chuẩn hoá dữ liệu đội tuyển đọc từ Blob: achievements string[] cũ → Achievement[]. */
function normalizeTeam(t: Team): Team {
  return { ...t, achievements: cleanAchievements(t.achievements as unknown) };
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
    teamHistory: cleanTeamHistory(input.teamHistory),
    achievements: cleanAchievements(input.achievements),
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
    achievements: cleanAchievements(input.achievements),
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

export async function saveTournament(input: Partial<Tournament> & { name: string }): Promise<Tournament> {
  const tournaments = await getTournamentsRaw();
  const now = new Date().toISOString();
  const id = input.id?.trim() || `tournament-${Date.now()}`;
  const taken = new Set(tournaments.filter((t) => t.id !== id).map((t) => t.slug));
  const slug = uniqueSlug((input.slug || '').trim() || slugify(input.name), taken);
  const tournament: Tournament = {
    id,
    slug,
    name: input.name.trim(),
    organizer: (input.organizer || '').trim(),
    frequency: (input.frequency || '').trim(),
    location: (input.location || '').trim(),
    description: (input.description || '').trim(),
    results: cleanList(input.results),
    updatedAt: now,
  };
  const idx = tournaments.findIndex((t) => t.id === id);
  const next = idx >= 0 ? tournaments.map((t, j) => (j === idx ? tournament : t)) : [...tournaments, tournament];
  await writeJsonFile(TOURNAMENTS_PATH, next);
  return tournament;
}

export async function deleteTournament(id: string): Promise<boolean> {
  const tournaments = await getTournamentsRaw();
  const next = tournaments.filter((t) => t.id !== id);
  if (next.length === tournaments.length) return false;
  await writeJsonFile(TOURNAMENTS_PATH, next);
  return true;
}
