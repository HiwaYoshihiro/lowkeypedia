import { list, put } from '@vercel/blob';
import { cache } from 'react';
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
/** Dữ liệu đọc thành công từ Blob được coi là "còn mới" trong 30 giây. */
const TTL_MS = 30_000;
/** Seed tạm (Blob lỗi / chưa cấu hình) chỉ giữ 5 giây để mau thử lại. */
const FALLBACK_TTL_MS = 5_000;
/** Danh sách blob dùng chung cho cả ba file; TTL ngắn để gộp các lượt đọc liền nhau. */
const LISTING_TTL_MS = 5_000;

/**
 * "Thế hệ" của cache: tăng 1 mỗi lần ghi dữ liệu (clearCache).
 *
 * Một lượt đọc bắt đầu TRƯỚC lệnh ghi mà kết thúc SAU lệnh ghi sẽ mang dữ liệu
 * cũ. Nếu cứ gán vào cache thì bản vừa lưu bị "hồi sinh" thành bản cũ. Vì vậy
 * mỗi lượt tải nhớ số thế hệ lúc khởi hành và chỉ được ghi cache khi còn nguyên
 * thế hệ đó.
 */
let generation = 0;

interface CacheEntry<T> {
  data: T[];
  at: number;
  /** true = đọc thành công từ Blob (dữ liệu thật); false = mới chỉ là seed tạm. */
  trusted: boolean;
}

function ttlOf(entry: CacheEntry<unknown>): number {
  return entry.trusted ? TTL_MS : FALLBACK_TTL_MS;
}

let warnedNoToken = false;

function hasToken(): boolean {
  const ok = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!ok && !warnedNoToken) {
    warnedNoToken = true;
    console.warn('[lwkypedia] BLOB_READ_WRITE_TOKEN chưa cấu hình — dùng dữ liệu seed (chỉ đọc)');
  }
  return ok;
}

/**
 * Khoá ghi toàn cục.
 *
 * Mọi thao tác lưu là read-modify-write trên file JSON, và một số thao tác còn
 * ghi sang file KHÁC (đổi/xoá slug đội → cập nhật tham chiếu trong tuyển thủ;
 * đổi/xoá slug giải → cập nhật cả tuyển thủ lẫn đội). Dùng MỘT hàng đợi chung
 * thay vì khoá theo từng file để:
 *   - tránh deadlock khi hai thao tác cần hai file theo thứ tự ngược nhau;
 *   - giữ trọn vẹn cả chuỗi ghi nhiều file của một thao tác.
 *
 * Quy mô wiki này chỉ có một quản trị viên nên thông lượng không phải vấn đề.
 * Lưu ý: các hàm ghi hộ (rewrite*Refs) KHÔNG được gọi `serialize` lại — chúng
 * chạy bên trong khoá đã giữ, gọi lại sẽ tự khoá chính mình.
 */
let writeChain: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task);
  // Giữ chuỗi sống nhưng không để lỗi làm hỏng các lần ghi sau.
  writeChain = next.catch(() => undefined);
  return next;
}

type ListedBlob = Awaited<ReturnType<typeof list>>['blobs'][number];

let listingCache: { blobs: ListedBlob[]; at: number } | null = null;
let listingInflight: Promise<ListedBlob[]> | null = null;

/**
 * Danh sách blob dưới prefix dữ liệu, dùng chung cho cả ba file.
 *
 * `list()` trả URL của mọi file trong prefix; trước đây mỗi file gọi riêng một
 * lần nên một trang cần cả ba file (trang chủ, sitemap…) tốn ba vòng gọi Blob.
 * Gộp lại còn một, kèm TTL ngắn và gộp cả request đồng thời.
 */
async function dataBlobs(): Promise<ListedBlob[]> {
  const hit = listingCache;
  if (hit && Date.now() - hit.at < LISTING_TTL_MS) return hit.blobs;
  if (listingInflight) return listingInflight;
  const gen = generation;
  const task = list({ prefix: PREFIX })
    .then(({ blobs }) => {
      // Bỏ qua kết quả nếu có lệnh ghi xen ngang (danh sách có thể đã cũ).
      if (gen === generation) listingCache = { blobs, at: Date.now() };
      return blobs;
    })
    .finally(() => {
      if (listingInflight === task) listingInflight = null;
    });
  listingInflight = task;
  return task;
}

/**
 * Đọc 1 file JSON từ Vercel Blob.
 *
 * Trả kèm cờ `trusted`: `false` nghĩa là đây chỉ là seed dùng tạm cho lượt đọc
 * này (thiếu token, Blob lỗi mạng…) — tầng cache sẽ chỉ giữ ngắn và không để nó
 * đè lên dữ liệu thật.
 *
 * - Chưa có token (chạy local chưa cấu hình): dùng seed kèm cảnh báo.
 * - File chưa tồn tại (list rỗng): PUT seed lên Blob rồi trả về seed.
 * - Lỗi mạng/Blob bất ngờ: fallback về seed cho RIÊNG lượt đọc này, KHÔNG ghi
 *   đè file thật (trước đây một lỗi 404/429/5xx tạm thời sẽ seed đè dữ liệu thật).
 */
async function readJsonFile<T>(path: string, seed: T): Promise<{ data: T; trusted: boolean }> {
  if (!hasToken()) {
    return { data: seed, trusted: false };
  }
  try {
    const blobs = await dataBlobs();
    const blob = blobs.find((b) => b.pathname === path);
    if (blob) {
      // Cache-bust: URL Blob không đổi khi ghi đè nên edge CDN có thể trả nội dung cũ.
      const freshUrl = `${blob.url}${blob.url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
      const res = await fetch(freshUrl, { cache: 'no-store' });
      if (res.ok) return { data: (await res.json()) as T, trusted: true };
      console.warn(`[lwkypedia] fetch ${path} -> HTTP ${res.status}; tạm dùng seed cho lượt đọc này`);
      return { data: seed, trusted: false };
    }
    // File thực sự chưa tồn tại → seed lần đầu.
    await put(path, JSON.stringify(seed), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    console.warn(`[lwkypedia] đã seed ${path} lên Blob`);
    return { data: seed, trusted: true };
  } catch (err) {
    console.warn(`[lwkypedia] lỗi đọc Blob (${path}), dùng seed:`, err);
    return { data: seed, trusted: false };
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

// ---------- Cache in-memory kiểu stale-while-revalidate ----------

/**
 * Cache một loại dữ liệu với ba tính chất:
 *
 * 1. Trong TTL: trả cache, không chạm mạng.
 * 2. Hết TTL: trả NGAY bản cũ và làm mới ở nền — người xem không phải chờ Blob
 *    (stale-while-revalidate). Làm mới lỗi thì vẫn còn bản cũ để phục vụ.
 * 3. Cache nguội: chờ tải, nhưng các request đồng thời dùng chung một promise
 *    nên một instance vừa khởi động chỉ gọi Blob một lần thay vì mỗi request một lần.
 */
function createStore<T>(load: () => Promise<{ data: T[]; trusted: boolean }>) {
  let entry: CacheEntry<T> | null = null;
  let inflight: Promise<T[]> | null = null;
  let retryAt = 0;

  async function fetchAndStore(gen: number): Promise<T[]> {
    const { data, trusted } = await load();
    if (gen !== generation) return data; // có lệnh ghi xen ngang — không lưu cache
    if (trusted || !entry) {
      entry = { data, at: Date.now(), trusted };
    } else {
      // Đang có dữ liệu thật, bản mới chỉ là seed tạm → giữ nguyên bản thật.
      retryAt = Date.now() + FALLBACK_TTL_MS;
    }
    return data;
  }

  /** Làm mới ở nền: không ai chờ, lỗi cũng không được làm sập request nào. */
  function startRefresh(gen: number): void {
    const task = fetchAndStore(gen)
      .catch((err) => {
        retryAt = Date.now() + FALLBACK_TTL_MS;
        console.warn('[lwkypedia] làm mới cache thất bại, giữ bản cũ:', err);
        return entry?.data ?? [];
      })
      .finally(() => {
        if (inflight === task) inflight = null;
      });
    inflight = task;
  }

  async function get(): Promise<T[]> {
    const now = Date.now();
    if (entry && now - entry.at < ttlOf(entry)) return entry.data;
    if (entry) {
      // Hết TTL: phục vụ bản cũ ngay, hẹn làm mới ở nền (trừ khi vừa thử mà lỗi).
      if (!inflight && now >= retryAt) startRefresh(generation);
      return entry.data;
    }
    if (inflight) return inflight; // nhiều request cùng chờ một lượt tải
    const task = fetchAndStore(generation).finally(() => {
      if (inflight === task) inflight = null;
    });
    inflight = task;
    return task;
  }

  function clear(): void {
    entry = null;
    inflight = null;
    retryAt = 0;
  }

  return { get, clear };
}

const playersStore = createStore<Player>(async () => {
  const { data, trusted } = await readJsonFile<Player[]>(PLAYERS_PATH, playersSeed as Player[]);
  return { data: data.map(normalizePlayer), trusted };
});

const teamsStore = createStore<Team>(async () => {
  const { data, trusted } = await readJsonFile<Team[]>(TEAMS_PATH, teamsSeed as Team[]);
  return { data: data.map(normalizeTeam), trusted };
});

const tournamentsStore = createStore<Tournament>(async () => {
  const { data, trusted } = await readJsonFile<Tournament[]>(TOURNAMENTS_PATH, tournamentsSeed as Tournament[]);
  return { data: data.map(normalizeTournament), trusted };
});

/**
 * Xoá cache in-memory sau mỗi lần ghi.
 *
 * Tăng `generation` để mọi lượt đọc đang bay (bắt đầu trước lệnh ghi) không ghi
 * đè cache bằng dữ liệu cũ khi chúng hoàn tất.
 */
export function clearCache(): void {
  generation += 1;
  playersStore.clear();
  teamsStore.clear();
  tournamentsStore.clear();
  listingCache = null;
  listingInflight = null;
}

function getPlayersRaw(): Promise<Player[]> {
  return playersStore.get();
}

function getTeamsRaw(): Promise<Team[]> {
  return teamsStore.get();
}

function getTournamentsRaw(): Promise<Tournament[]> {
  return tournamentsStore.get();
}

// ---------- Đọc ----------
// Bọc `cache()` của React để trong CÙNG một request, `generateMetadata` và page
// không đọc lại dữ liệu lần thứ hai.

export const getPlayers = cache(async (): Promise<Player[]> => {
  const players = await getPlayersRaw();
  return [...players].sort((a, b) => a.ign.localeCompare(b.ign, 'vi'));
});

export const getTeams = cache(async (): Promise<Team[]> => {
  const teams = await getTeamsRaw();
  return [...teams].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

export const getPlayerBySlug = cache(async (slug: string): Promise<Player | null> => {
  return (await getPlayersRaw()).find((p) => p.slug === slug) ?? null;
});

export const getTeamBySlug = cache(async (slug: string): Promise<Team | null> => {
  return (await getTeamsRaw()).find((t) => t.slug === slug) ?? null;
});

export const getPlayersByTeam = cache(async (teamSlug: string): Promise<Player[]> => {
  return (await getPlayersRaw()).filter((p) => p.teamSlug === teamSlug);
});

export const getTournaments = cache(async (): Promise<Tournament[]> => {
  const tournaments = await getTournamentsRaw();
  return [...tournaments].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});

export const getTournamentBySlug = cache(async (slug: string): Promise<Tournament | null> => {
  return (await getTournamentsRaw()).find((t) => t.slug === slug) ?? null;
});

export const searchAll = cache(async (q: string): Promise<SearchResult[]> => {
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
});

// ---------- Chuẩn hoá dữ liệu đọc từ Blob ----------

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || 'untitled';
  let i = 2;
  while (taken.has(slug)) slug = `${base || 'untitled'}-${i++}`;
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

/** Chuẩn hoá giải đấu: `results` luôn là mảng string (bản cũ có thể là string). */
function normalizeTournament(t: Tournament): Tournament {
  return { ...t, results: cleanList(t.results as unknown) };
}

// ---------- Ghi ----------

/** Lỗi do dữ liệu người dùng nhập sai — route handler trả về 400 kèm thông báo. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Chuẩn hoá slug do quản trị viên nhập: luôn bỏ dấu/khoảng trắng để URL ổn định. */
function normalizeSlugInput(input: string | undefined, fallbackSource: string): string {
  const raw = (input || '').trim();
  return slugify(raw || fallbackSource);
}

export async function savePlayer(input: Partial<Player> & { ign: string }): Promise<Player> {
  if (!ROLES.includes(input.role as Role)) throw new ValidationError('Vị trí (role) không hợp lệ');
  return serialize(async () => {
    const players = await getPlayersRaw();
    const now = new Date().toISOString();
    const id = input.id?.trim() || `player-${Date.now()}`;
    const taken = new Set(players.filter((p) => p.id !== id).map((p) => p.slug));
    const slug = uniqueSlug(normalizeSlugInput(input.slug, input.ign), taken);
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
  });
}

export async function deletePlayer(id: string): Promise<boolean> {
  return serialize(async () => {
    const players = await getPlayersRaw();
    const next = players.filter((p) => p.id !== id);
    if (next.length === players.length) return false;
    await writeJsonFile(PLAYERS_PATH, next);
    return true;
  });
}

/**
 * Ghi lại các tham chiếu trong players khi đội tuyển đổi slug hoặc bị xoá.
 * `newSlug = null` nghĩa là đội đã bị xoá → gỡ liên kết, giữ nguyên tên đội dạng chữ.
 */
async function rewritePlayerTeamRefs(oldSlug: string, newSlug: string | null): Promise<void> {
  const players = await getPlayersRaw();
  let changed = false;
  const next = players.map((p) => {
    let touched = false;
    let teamSlug = p.teamSlug;
    if (p.teamSlug === oldSlug) {
      teamSlug = newSlug;
      touched = true;
    }
    const teamHistory = p.teamHistory?.map((h) => {
      if (h.teamSlug !== oldSlug) return h;
      touched = true;
      const { teamSlug: _drop, ...rest } = h;
      return newSlug ? { ...rest, teamSlug: newSlug } : rest;
    });
    if (!touched) return p;
    changed = true;
    return { ...p, teamSlug, teamHistory };
  });
  if (changed) await writeJsonFile(PLAYERS_PATH, next);
}

/** Ghi lại `achievements[].tournamentSlug` khi giải đấu đổi slug hoặc bị xoá. */
async function rewriteTournamentRefs(oldSlug: string, newSlug: string | null): Promise<void> {
  const [players, teams] = await Promise.all([getPlayersRaw(), getTeamsRaw()]);
  const remap = (a: Achievement): Achievement => {
    if (a.tournamentSlug !== oldSlug) return a;
    if (newSlug) return { ...a, tournamentSlug: newSlug };
    const { tournamentSlug: _drop, ...rest } = a;
    return rest;
  };
  const nextPlayers = players.map((p) => ({ ...p, achievements: p.achievements.map(remap) }));
  const nextTeams = teams.map((t) => ({ ...t, achievements: t.achievements.map(remap) }));
  await Promise.all([
    writeJsonFile(PLAYERS_PATH, nextPlayers),
    writeJsonFile(TEAMS_PATH, nextTeams),
  ]);
}

export async function saveTeam(input: Partial<Team> & { name: string }): Promise<Team> {
  return serialize(async () => {
    const teams = await getTeamsRaw();
    const now = new Date().toISOString();
    const id = input.id?.trim() || `team-${Date.now()}`;
    const previous = teams.find((t) => t.id === id);
    const taken = new Set(teams.filter((t) => t.id !== id).map((t) => t.slug));
    const slug = uniqueSlug(normalizeSlugInput(input.slug, input.name), taken);
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
    if (previous && previous.slug !== slug) {
      await rewritePlayerTeamRefs(previous.slug, slug);
    }
    return team;
  });
}

export async function deleteTeam(id: string): Promise<boolean> {
  return serialize(async () => {
    const teams = await getTeamsRaw();
    const victim = teams.find((t) => t.id === id);
    const next = teams.filter((t) => t.id !== id);
    if (next.length === teams.length) return false;
    await writeJsonFile(TEAMS_PATH, next);
    if (victim) await rewritePlayerTeamRefs(victim.slug, null);
    return true;
  });
}

export async function saveTournament(input: Partial<Tournament> & { name: string }): Promise<Tournament> {
  return serialize(async () => {
    const tournaments = await getTournamentsRaw();
    const now = new Date().toISOString();
    const id = input.id?.trim() || `tournament-${Date.now()}`;
    const previous = tournaments.find((t) => t.id === id);
    const taken = new Set(tournaments.filter((t) => t.id !== id).map((t) => t.slug));
    const slug = uniqueSlug(normalizeSlugInput(input.slug, input.name), taken);
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
    if (previous && previous.slug !== slug) {
      await rewriteTournamentRefs(previous.slug, slug);
    }
    return tournament;
  });
}

export async function deleteTournament(id: string): Promise<boolean> {
  return serialize(async () => {
    const tournaments = await getTournamentsRaw();
    const victim = tournaments.find((t) => t.id === id);
    const next = tournaments.filter((t) => t.id !== id);
    if (next.length === tournaments.length) return false;
    await writeJsonFile(TOURNAMENTS_PATH, next);
    if (victim) await rewriteTournamentRefs(victim.slug, null);
    return true;
  });
}
