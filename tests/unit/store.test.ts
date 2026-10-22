// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player, Team, Tournament } from '@/lib/types';

const PLAYERS = 'lowkeypedia/data/players.json';
const TEAMS = 'lowkeypedia/data/teams.json';
const TOURNAMENTS = 'lowkeypedia/data/tournaments.json';

vi.mock('@vercel/blob', async () => {
  const helper = await import('./helpers/fake-blob');
  return { list: helper.mockList, put: helper.mockPut };
});

import {
  blob,
  blobFor,
  installFakeFetch,
  listFromFiles,
  mockList,
  mockPut,
  resetFakeBlob,
  seedFile,
} from './helpers/fake-blob';
import {
  ValidationError,
  clearCache,
  deletePlayer,
  deleteTeam,
  deleteTournament,
  getPlayerBySlug,
  getPlayers,
  getPlayersByTeam,
  getTeamBySlug,
  getTeams,
  getTournamentBySlug,
  getTournaments,
  savePlayer,
  saveTeam,
  saveTournament,
  searchAll,
} from '@/lib/store';
import playersSeed from '@/data/seed/players.json';
import teamsSeed from '@/data/seed/teams.json';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    slug: 'lai-bang',
    ign: 'Lai Bâng',
    role: 'Đi Rừng',
    teamSlug: null,
    nationality: 'Việt Nam',
    biography: '',
    careerHistory: '',
    achievements: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 't1',
    slug: 'saigon-phantom',
    name: 'Saigon Phantom',
    tag: 'SGP',
    region: 'Việt Nam',
    description: '',
    achievements: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 'g1',
    slug: 'aic',
    name: 'AIC',
    organizer: 'Garena',
    frequency: 'Hằng năm',
    location: 'Việt Nam',
    description: '',
    results: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Đọc lại nội dung một file JSON đã ghi vào Blob giả. */
function readFile<T>(pathname: string): T {
  const raw = blob.files.get(pathname);
  if (!raw) throw new Error(`chưa ghi ${pathname}`);
  return JSON.parse(raw) as T;
}

/** Cho các promise nền (SWR refresh) chạy xong. */
async function flushBackground(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe('lib/store', () => {
  beforeEach(async () => {
    await resetFakeBlob();
    installFakeFetch();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await resetFakeBlob();
  });

  describe('đọc dữ liệu', () => {
    it('không có token thì dùng seed và không gọi mạng', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      const players = await getPlayers();
      expect(players).toHaveLength(playersSeed.length);
      expect(mockList).not.toHaveBeenCalled();
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('file chưa tồn tại thì seed lần đầu lên Blob', async () => {
      const players = await getPlayers();
      expect(players).toHaveLength(playersSeed.length);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith(
        PLAYERS,
        expect.any(String),
        expect.objectContaining({
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
        })
      );
    });

    it('trong TTL thì dùng cache, không gọi list lại', async () => {
      seedFile(PLAYERS, [makePlayer()]);
      listFromFiles();
      await getPlayers();
      await getPlayers();
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    it('hết TTL thì trả bản cũ ngay rồi làm mới ở nền', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      seedFile(PLAYERS, [makePlayer({ ign: 'Ban Cũ' })]);
      listFromFiles();
      expect((await getPlayers())[0].ign).toBe('Ban Cũ');

      seedFile(PLAYERS, [makePlayer({ ign: 'Ban Mới' })]);
      vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));

      // Hết TTL: phục vụ bản cũ ngay, không chờ Blob.
      expect((await getPlayers())[0].ign).toBe('Ban Cũ');
      await flushBackground();
      expect((await getPlayers())[0].ign).toBe('Ban Mới');
    });

    it('lỗi mạng không đè dữ liệu thật bằng seed', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      seedFile(PLAYERS, [makePlayer({ ign: 'Du Lieu That' })]);
      listFromFiles();
      expect((await getPlayers())[0].ign).toBe('Du Lieu That');

      blob.failNextRead = true;
      vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));
      expect((await getPlayers())[0].ign).toBe('Du Lieu That');
      await flushBackground();
      // Bản seed tạm không được thay thế dữ liệu thật đang giữ.
      expect((await getPlayers())[0].ign).toBe('Du Lieu That');

      blob.failNextRead = false;
      vi.setSystemTime(new Date('2026-01-01T00:00:40Z'));
      await getPlayers();
      await flushBackground();
      expect((await getPlayers())[0].ign).toBe('Du Lieu That');
    });

    it('tìm kiếm không dấu trả đúng thực thể', async () => {
      seedFile(PLAYERS, [makePlayer({ ign: 'Lai Bâng', slug: 'lai-bang' })]);
      seedFile(TEAMS, []);
      seedFile(TOURNAMENTS, []);
      listFromFiles();
      const results = await searchAll('lai bang');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        type: 'player',
        slug: 'lai-bang',
        title: 'Lai Bâng',
      });
      expect(await searchAll('   ')).toEqual([]);
    });

    it('tra cứu theo slug và theo đội', async () => {
      seedFile(PLAYERS, [
        makePlayer({ id: 'p1', slug: 'lai-bang', teamSlug: 'sgp' }),
        makePlayer({ id: 'p2', slug: 'khoa', ign: 'Khoa', teamSlug: 'sgp' }),
      ]);
      seedFile(TEAMS, [makeTeam({ slug: 'sgp', name: 'SGP' })]);
      seedFile(TOURNAMENTS, [makeTournament({ slug: 'aic', name: 'AIC' })]);
      listFromFiles();

      expect((await getPlayerBySlug('lai-bang'))?.ign).toBe('Lai Bâng');
      expect(await getPlayerBySlug('khong-co')).toBeNull();
      expect((await getTeamBySlug('sgp'))?.name).toBe('SGP');
      expect(await getTeamBySlug('khong-co')).toBeNull();
      expect(await getPlayersByTeam('sgp')).toHaveLength(2);
      expect(await getPlayersByTeam('khac')).toHaveLength(0);
      expect((await getTournaments())[0].slug).toBe('aic');
      expect((await getTournamentBySlug('aic'))?.name).toBe('AIC');
      expect(await getTournamentBySlug('khong-co')).toBeNull();
    });

    it('danh sách đội và giải được sắp xếp theo tên tiếng Việt', async () => {
      seedFile(PLAYERS, []);
      seedFile(TEAMS, [
        makeTeam({ id: 't1', slug: 'binh-dinh', name: 'Bình Định' }),
        makeTeam({ id: 't2', slug: 'an-giang', name: 'An Giang' }),
      ]);
      seedFile(TOURNAMENTS, [
        makeTournament({ id: 'g1', slug: 'z-cup', name: 'Z Cup' }),
        makeTournament({ id: 'g2', slug: 'dau-truong', name: 'Đấu Trường' }),
      ]);
      listFromFiles();

      expect((await getTeams()).map((t) => t.slug)).toEqual(['an-giang', 'binh-dinh']);
      // "Đấu Trường" đứng trước "Z Cup" theo bảng chữ cái tiếng Việt.
      expect((await getTournaments()).map((t) => t.slug)).toEqual(['dau-truong', 'z-cup']);
    });

    it('tìm kiếm khớp cả tag/khu vực của đội và ban tổ chức/địa điểm của giải', async () => {
      seedFile(PLAYERS, []);
      seedFile(TEAMS, [
        makeTeam({ id: 't1', slug: 'sgp', name: 'Saigon Phantom', tag: 'SGP', region: 'TP.HCM' }),
      ]);
      seedFile(TOURNAMENTS, [
        makeTournament({
          id: 'g1',
          slug: 'aic',
          name: 'AIC',
          organizer: 'Garena',
          location: 'Đà Nẵng',
        }),
      ]);
      listFromFiles();

      expect((await searchAll('sgp'))[0]).toMatchObject({
        type: 'team',
        slug: 'sgp',
        subtitle: 'SGP • TP.HCM',
      });
      expect((await searchAll('tp.hcm'))[0]).toMatchObject({ type: 'team', slug: 'sgp' });
      expect((await searchAll('garena'))[0]).toMatchObject({
        type: 'tournament',
        slug: 'aic',
        subtitle: 'Giải đấu • Garena',
      });
      expect((await searchAll('da nang'))[0]).toMatchObject({ type: 'tournament', slug: 'aic' });
    });

    it('Blob trả lỗi HTTP thì dùng seed cho lượt đọc đó', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      seedFile(PLAYERS, [makePlayer({ ign: 'Không đọc được' })]);
      listFromFiles();
      // `list` vẫn báo có file nhưng nội dung đã biến mất → fetch nhận 404.
      blob.files.delete(PLAYERS);

      const players = await getPlayers();

      expect(players).toHaveLength(playersSeed.length);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`fetch ${PLAYERS} -> HTTP 404`)
      );
      warn.mockRestore();
    });

    it('hai lượt đọc nguội đồng thời chỉ gọi list một lần', async () => {
      seedFile(PLAYERS, [makePlayer()]);
      listFromFiles();

      const [a, b] = await Promise.all([getPlayers(), getPlayers()]);

      expect(a).toEqual(b);
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    it('lượt đọc đang bay không ghi cache nếu có lệnh ghi xen ngang', async () => {
      seedFile(PLAYERS, [makePlayer({ ign: 'Bản Cũ' })]);
      let release!: () => void;
      mockList.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ blobs: [blobFor(PLAYERS)] });
          })
      );

      const pending = getPlayers();
      // Lệnh ghi xen ngang: clearCache tăng generation và xoá cache.
      clearCache();
      release();

      expect((await pending)[0].ign).toBe('Bản Cũ');

      // Kết quả cũ không được nằm lại trong cache → lượt đọc sau phải list lại.
      listFromFiles();
      const callsBefore = mockList.mock.calls.length;
      expect((await getPlayers())[0].ign).toBe('Bản Cũ');
      expect(mockList.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('làm mới nền lỗi thì giữ bản cũ và tạm dừng thử lại 5 giây', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      seedFile(PLAYERS, [makePlayer({ ign: 'Bản Thật' })]);
      listFromFiles();
      expect((await getPlayers())[0].ign).toBe('Bản Thật');

      // Blob trả JSON hỏng cấu trúc → bước chuẩn hoá ném lỗi trong lần làm mới nền.
      blob.files.set(PLAYERS, '{}');
      vi.setSystemTime(new Date('2026-01-01T00:00:31Z'));

      expect((await getPlayers())[0].ign).toBe('Bản Thật');
      await flushBackground();

      expect(warn).toHaveBeenCalledWith(
        '[lwkypedia] làm mới cache thất bại, giữ bản cũ:',
        expect.any(TypeError)
      );

      // Trong 5 giây tạm dừng, không thử lại Blob.
      const calls = mockList.mock.calls.length;
      expect((await getPlayers())[0].ign).toBe('Bản Thật');
      expect(mockList.mock.calls.length).toBe(calls);
      warn.mockRestore();
    });
  });

  describe('ghi dữ liệu', () => {
    it('tạo tuyển thủ mới với slug và id tự sinh', async () => {
      seedFile(PLAYERS, []);
      listFromFiles();
      const player = await savePlayer({ ign: 'Tester', role: 'Trợ Thủ' });
      expect(player.slug).toBe('tester');
      expect(player.id.startsWith('player-')).toBe(true);
      expect(Number.isNaN(Date.parse(player.updatedAt))).toBe(false);
      expect(readFile<Player[]>(PLAYERS)).toHaveLength(1);
      expect((await getPlayers())[0].ign).toBe('Tester');
    });

    it('slug trùng thì thêm hậu tố, tên rỗng thì thành untitled', async () => {
      seedFile(PLAYERS, [makePlayer({ slug: 'tester' })]);
      listFromFiles();
      const second = await savePlayer({ ign: 'Tester', role: 'Xạ Thủ' });
      expect(second.slug).toBe('tester-2');
      const unnamed = await savePlayer({ ign: '   ', role: 'Xạ Thủ' });
      expect(unnamed.slug).toBe('untitled');
    });

    it('cập nhật tuyển thủ theo id, giữ nguyên vị trí trong file', async () => {
      seedFile(PLAYERS, [
        makePlayer({ id: 'p1', slug: 'cu', ign: 'Cũ' }),
        makePlayer({ id: 'p2', slug: 'giu', ign: 'Giữ' }),
      ]);
      listFromFiles();

      const updated = await savePlayer({
        id: 'p1',
        ign: 'Mới',
        role: 'Xạ Thủ',
        teamSlug: '   ',
      });

      expect(updated.slug).toBe('moi');
      const file = readFile<Player[]>(PLAYERS);
      expect(file.map((p) => p.id)).toEqual(['p1', 'p2']);
      expect(file[0].ign).toBe('Mới');
      expect(file[0].teamSlug).toBeNull();
    });

    it('xoá tuyển thủ đang tồn tại trả true và ghi file mới', async () => {
      seedFile(PLAYERS, [makePlayer({ id: 'p1' })]);
      listFromFiles();

      expect(await deletePlayer('p1')).toBe(true);

      expect(readFile<Player[]>(PLAYERS)).toEqual([]);
    });

    it('từ chối role không hợp lệ', async () => {
      seedFile(PLAYERS, []);
      listFromFiles();
      await expect(savePlayer({ ign: 'X', role: 'Làm vườn' as never })).rejects.toBeInstanceOf(
        ValidationError
      );
      await expect(savePlayer({ ign: 'X', role: 'Làm vườn' as never })).rejects.toThrow(
        'Vị trí (role) không hợp lệ'
      );
    });

    it('đổi slug đội thì cập nhật tham chiếu trong tuyển thủ', async () => {
      seedFile(TEAMS, [
        makeTeam({ id: 't1', slug: 'a', name: 'A' }),
        makeTeam({ id: 't2', slug: 'b', name: 'B' }),
      ]);
      seedFile(PLAYERS, [
        makePlayer({
          id: 'p1',
          teamSlug: 'a',
          teamHistory: [
            { period: '2024', team: 'A', teamSlug: 'a' },
            { period: '2023', team: 'B', teamSlug: 'b' },
          ],
        }),
        makePlayer({
          id: 'p2',
          slug: 'khac',
          ign: 'Khác',
          teamSlug: 'b',
          teamHistory: [{ period: '2023', team: 'B', teamSlug: 'b' }],
        }),
      ]);
      listFromFiles();

      await saveTeam({ id: 't1', name: 'A Mới' });

      const players = readFile<Player[]>(PLAYERS);
      expect(players[0].teamSlug).toBe('a-moi');
      expect(players[0].teamHistory?.[0].teamSlug).toBe('a-moi');
      // Dòng lịch sử của đội khác và tuyển thủ không liên quan giữ nguyên.
      expect(players[0].teamHistory?.[1].teamSlug).toBe('b');
      expect(players[1].teamSlug).toBe('b');
    });

    it('xoá đội thì gỡ tham chiếu, giữ tên đội dạng chữ', async () => {
      seedFile(TEAMS, [makeTeam({ id: 't1', slug: 'a', name: 'A' })]);
      seedFile(PLAYERS, [
        makePlayer({
          teamSlug: 'a',
          teamHistory: [{ period: '2024', team: 'A', teamSlug: 'a' }],
        }),
      ]);
      listFromFiles();

      expect(await deleteTeam('t1')).toBe(true);

      const players = readFile<Player[]>(PLAYERS);
      expect(players[0].teamSlug).toBeNull();
      expect(players[0].teamHistory?.[0]).toEqual({ period: '2024', team: 'A' });
    });

    it('đổi slug giải thì cập nhật tournamentSlug trong thành tích của tuyển thủ và đội', async () => {
      seedFile(TOURNAMENTS, [
        makeTournament({ id: 'g1', slug: 'aic', name: 'AIC' }),
        makeTournament({ id: 'g2', slug: 'apl', name: 'APL' }),
      ]);
      seedFile(PLAYERS, [
        makePlayer({
          achievements: [
            { year: '2025', placement: 'Vô địch', tournament: 'AIC', tournamentSlug: 'aic' },
            { year: '2024', placement: 'Á quân', tournament: 'APL', tournamentSlug: 'apl' },
          ],
        }),
      ]);
      seedFile(TEAMS, [
        makeTeam({
          id: 't9',
          slug: 'sgp',
          achievements: [
            { year: '2025', placement: 'Vô địch', tournament: 'AIC', tournamentSlug: 'aic' },
            { year: '2023', placement: 'Top 4', tournament: 'Giải ngoài wiki' },
          ],
        }),
      ]);
      listFromFiles();

      await saveTournament({ id: 'g1', name: 'AIC 2026' });

      const playerAchievements = readFile<Player[]>(PLAYERS)[0].achievements;
      expect(playerAchievements[0].tournamentSlug).toBe('aic-2026');
      // Thành tích của giải khác không bị đụng tới.
      expect(playerAchievements[1].tournamentSlug).toBe('apl');

      const teamAchievements = readFile<Team[]>(TEAMS).find((t) => t.id === 't9')?.achievements ?? [];
      expect(teamAchievements[0].tournamentSlug).toBe('aic-2026');
      expect('tournamentSlug' in teamAchievements[1]).toBe(false);
    });

    it('xoá giải thì bỏ tournamentSlug khỏi thành tích', async () => {
      seedFile(TOURNAMENTS, [makeTournament({ id: 'g1', slug: 'aic', name: 'AIC' })]);
      seedFile(PLAYERS, [
        makePlayer({ achievements: [{ year: '2025', placement: 'Vô địch', tournament: 'AIC', tournamentSlug: 'aic' }] }),
      ]);
      seedFile(TEAMS, [makeTeam({ achievements: [] })]);
      listFromFiles();

      expect(await deleteTournament('g1')).toBe(true);

      const achievement = readFile<Player[]>(PLAYERS)[0].achievements[0];
      expect(achievement).toEqual({ year: '2025', placement: 'Vô địch', tournament: 'AIC' });
      expect('tournamentSlug' in achievement).toBe(false);
    });

    it('từ chối ghi khi chỉ đọc được seed tạm', async () => {
      seedFile(PLAYERS, [makePlayer()]);
      listFromFiles();
      blob.failNextRead = true;

      await expect(savePlayer({ ign: 'Tester', role: 'Trợ Thủ' })).rejects.toThrow(
        'Không đọc được dữ liệu mới nhất từ Blob'
      );
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('xoá thực thể không tồn tại trả false và không ghi', async () => {
      seedFile(PLAYERS, [makePlayer({ id: 'p1' })]);
      seedFile(TEAMS, [makeTeam({ id: 't1' })]);
      seedFile(TOURNAMENTS, [makeTournament({ id: 'g1' })]);
      listFromFiles();

      expect(await deletePlayer('khong-co')).toBe(false);
      expect(await deleteTeam('khong-co')).toBe(false);
      expect(await deleteTournament('khong-co')).toBe(false);
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('từ chối ghi khi chưa cấu hình token', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      await expect(savePlayer({ ign: 'Tester', role: 'Trợ Thủ' })).rejects.toThrow(
        'BLOB_READ_WRITE_TOKEN chưa được cấu hình'
      );
    });
  });

  describe('chuẩn hoá dữ liệu cũ đọc từ Blob', () => {
    it('achievement dạng chuỗi và lịch sử đội thiếu field được chuẩn hoá', async () => {
      seedFile(PLAYERS, [
        {
          id: 'p-old',
          slug: 'old',
          ign: 'Old',
          role: 'Xạ Thủ',
          teamSlug: null,
          nationality: 'Việt Nam',
          biography: '',
          careerHistory: '',
          achievements: ['AIC 2020', '  ', { year: ' 2021 ', placement: 'Á quân', tournament: ' APL ' }],
          teamHistory: [{ period: ' 2020 ', team: ' ' }, null, { period: '', team: '' }],
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
      ]);
      seedFile(TEAMS, []);
      seedFile(TOURNAMENTS, []);
      listFromFiles();

      const player = await getPlayerBySlug('old');
      expect(player?.achievements).toEqual([
        { year: '', placement: '', tournament: 'AIC 2020' },
        { year: '2021', placement: 'Á quân', tournament: 'APL' },
      ]);
      // Dòng lịch sử không có tên đội bị bỏ; còn lại giữ nguyên.
      expect(player?.teamHistory).toEqual([{ period: '2020', team: '' }]);
    });

    it('results của giải đấu dạng chuỗi nhiều dòng được tách', async () => {
      seedFile(TOURNAMENTS, [
        {
          id: 'g-old',
          slug: 'old-cup',
          name: 'Old Cup',
          organizer: 'BTC',
          frequency: 'Một lần',
          location: 'VN',
          description: '',
          results: '2024 — Vô địch: A\n2025 — Vô địch: B\n\n',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      seedFile(PLAYERS, []);
      seedFile(TEAMS, []);
      listFromFiles();

      expect((await getTournamentBySlug('old-cup'))?.results).toEqual([
        '2024 — Vô địch: A',
        '2025 — Vô địch: B',
      ]);
    });

    it('achievement rỗng hoặc sai kiểu bị bỏ qua', async () => {
      seedFile(PLAYERS, [
        {
          ...makePlayer(),
          achievements: [{}, 42, null, { year: '2025' }],
        },
      ]);
      seedFile(TEAMS, []);
      seedFile(TOURNAMENTS, []);
      listFromFiles();

      expect((await getPlayerBySlug('lai-bang'))?.achievements).toEqual([
        { year: '2025', placement: '', tournament: '' },
      ]);
    });

    it('results dạng mảng được trim và bỏ phần rỗng', async () => {
      seedFile(TOURNAMENTS, [
        {
          ...makeTournament(),
          results: [' 2024 — Vô địch: A ', '', 2024],
        },
      ]);
      seedFile(PLAYERS, []);
      seedFile(TEAMS, []);
      listFromFiles();

      expect((await getTournamentBySlug('aic'))?.results).toEqual(['2024 — Vô địch: A', '2024']);
    });
  });
});
