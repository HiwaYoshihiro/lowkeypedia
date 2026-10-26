// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player, Team, Tournament } from '@/lib/types';

/**
 * Test xếp hạng của `searchAll`: khớp chính xác tên > khớp đầu từ > khớp giữa
 * chuỗi, khớp ở tên > khớp ở trường phụ, cùng hạng thì theo chữ cái, và tối đa
 * 20 kết quả. Dùng Blob giả như `store.test.ts` để không cần Vercel Blob thật.
 */
vi.mock('@vercel/blob', async () => {
  const helper = await import('./helpers/fake-blob');
  return { list: helper.mockList, put: helper.mockPut };
});

import { installFakeFetch, listFromFiles, resetFakeBlob, seedFile } from './helpers/fake-blob';
import { searchAll } from '@/lib/store';

const PLAYERS = 'lowkeypedia/data/players.json';
const TEAMS = 'lowkeypedia/data/teams.json';
const TOURNAMENTS = 'lowkeypedia/data/tournaments.json';

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

describe('searchAll — xếp hạng', () => {
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

  it('xếp khớp chính xác tên trước khớp đầu từ, rồi khớp giữa chuỗi', async () => {
    seedFile(PLAYERS, [
      makePlayer({ id: 'p3', slug: 'kalai', ign: 'Kalai' }), // khớp giữa chuỗi
      makePlayer({ id: 'p2', slug: 'lai-bang', ign: 'Lai Bâng' }), // khớp đầu từ
      makePlayer({ id: 'p1', slug: 'lai', ign: 'Lai' }), // khớp chính xác
    ]);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    const results = await searchAll('lai');

    expect(results.map((r) => r.slug)).toEqual(['lai', 'lai-bang', 'kalai']);
  });

  it('cùng hạng thì sắp xếp theo thứ tự chữ cái tiếng Việt', async () => {
    seedFile(PLAYERS, [
      makePlayer({ id: 'p1', slug: 'lai-mot', ign: 'Lai Một' }),
      makePlayer({ id: 'p2', slug: 'lai-hai', ign: 'Lai Hai' }),
    ]);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    expect((await searchAll('lai')).map((r) => r.title)).toEqual(['Lai Hai', 'Lai Một']);
  });

  it('khớp ở tên xếp trên khớp ở trường phụ', async () => {
    seedFile(PLAYERS, [
      // Chỉ khớp ở vai trò ("Đi Rừng"), tên xếp trước theo chữ cái.
      makePlayer({ id: 'p1', slug: 'aatrox', ign: 'Aatrox', role: 'Đi Rừng' }),
      // Khớp chính xác ở tên.
      makePlayer({ id: 'p2', slug: 'rung', ign: 'Rừng', role: 'Xạ Thủ' }),
    ]);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    expect((await searchAll('rung')).map((r) => r.slug)).toEqual(['rung', 'aatrox']);
  });

  it('vẫn tìm được theo tag/khu vực của đội và ban tổ chức/địa điểm của giải', async () => {
    seedFile(PLAYERS, []);
    seedFile(TEAMS, [
      makeTeam({ id: 't1', slug: 'sgp', name: 'Saigon Phantom', tag: 'SGP', region: 'TP.HCM' }),
    ]);
    seedFile(TOURNAMENTS, [
      makeTournament({ id: 'g1', slug: 'aic', name: 'AIC', organizer: 'Garena', location: 'Đà Nẵng' }),
    ]);
    listFromFiles();

    expect((await searchAll('sgp'))[0]).toMatchObject({ type: 'team', slug: 'sgp' });
    expect((await searchAll('tp.hcm'))[0]).toMatchObject({ type: 'team', slug: 'sgp' });
    expect((await searchAll('garena'))[0]).toMatchObject({ type: 'tournament', slug: 'aic' });
    expect((await searchAll('da nang'))[0]).toMatchObject({ type: 'tournament', slug: 'aic' });
  });

  it('giữ nguyên hình dạng SearchResult trả về', async () => {
    seedFile(PLAYERS, [
      makePlayer({ ign: 'Lai Bâng', slug: 'lai-bang', realName: 'Nguyễn Văn A', role: 'Đi Rừng' }),
    ]);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    expect(await searchAll('lai bang')).toEqual([
      {
        type: 'player',
        slug: 'lai-bang',
        title: 'Lai Bâng',
        subtitle: 'Đi Rừng • Nguyễn Văn A',
      },
    ]);
  });

  it('cắt còn tối đa 20 kết quả, giữ những kết quả hạng cao nhất', async () => {
    const players = Array.from({ length: 30 }, (_, i) => {
      const so = String(i + 1).padStart(2, '0');
      return makePlayer({ id: `p${so}`, slug: `cao-thu-${so}`, ign: `Cao Thủ ${so}` });
    });
    seedFile(PLAYERS, players);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    const results = await searchAll('cao thu');

    expect(results).toHaveLength(20);
    expect(results[0].title).toBe('Cao Thủ 01');
    expect(results[19].title).toBe('Cao Thủ 20');
  });

  it('cắt 20 kết quả sau khi đã xếp hạng, không phải theo thứ tự dữ liệu', async () => {
    // 25 kết quả khớp giữa chuỗi đứng trước trong file, 1 kết quả khớp chính xác
    // đứng cuối — kết quả khớp chính xác vẫn phải có mặt sau khi cắt.
    const players = Array.from({ length: 25 }, (_, i) => {
      const so = String(i + 1).padStart(2, '0');
      return makePlayer({ id: `x${so}`, slug: `xen-ken-${so}`, ign: `Xenkenday${so}` });
    });
    players.push(makePlayer({ id: 'p-exact', slug: 'xen-ken-day', ign: 'Day' }));
    seedFile(PLAYERS, players);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    const results = await searchAll('day');

    expect(results).toHaveLength(20);
    expect(results[0]).toMatchObject({ slug: 'xen-ken-day' });
  });

  it('từ khoá rỗng chỉ toàn khoảng trắng trả về mảng rỗng', async () => {
    seedFile(PLAYERS, [makePlayer()]);
    seedFile(TEAMS, [makeTeam()]);
    seedFile(TOURNAMENTS, [makeTournament()]);
    listFromFiles();

    expect(await searchAll('   ')).toEqual([]);
  });
});
