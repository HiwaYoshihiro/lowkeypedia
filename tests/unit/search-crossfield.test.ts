// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player, Team, Tournament } from '@/lib/types';

/**
 * Truy vấn nhiều từ nằm rải ở nhiều trường khác nhau ("sgp hcm" = tag của đội +
 * khu vực) vẫn phải tìm ra, nhưng xếp dưới mọi khớp trọn một trường.
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

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 't1',
    slug: 'saigon-phantom',
    name: 'Saigon Phantom',
    tag: 'SGP',
    region: 'TP.HCM',
    description: '',
    achievements: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

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

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 'g1',
    slug: 'aic',
    name: 'AIC',
    organizer: 'Garena',
    frequency: 'Hằng năm',
    location: 'TP.HCM',
    description: '',
    results: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('searchAll — truy vấn nhiều từ vắt qua nhiều trường', () => {
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

  it('khớp khi các từ nằm ở hai trường khác nhau (tag + khu vực)', async () => {
    seedFile(PLAYERS, []);
    seedFile(TEAMS, [makeTeam()]);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    const results = await searchAll('sgp hcm');

    expect(results.map((r) => r.slug)).toContain('saigon-phantom');
  });

  it('khớp được cả khi từ khoá có dấu, không dấu và viết hoa', async () => {
    seedFile(PLAYERS, []);
    seedFile(TEAMS, [makeTeam()]);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    expect((await searchAll('SGP TP.HCM')).map((r) => r.slug)).toContain('saigon-phantom');
    expect((await searchAll('saigon hcm')).map((r) => r.slug)).toContain('saigon-phantom');
  });

  it('khớp trọn một trường luôn xếp trên khớp rải nhiều trường', async () => {
    seedFile(PLAYERS, [makePlayer({ slug: 'sgp-hcm', ign: 'SGP HCM' })]);
    seedFile(TEAMS, [makeTeam()]);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    const results = await searchAll('sgp hcm');

    // "SGP HCM" khớp trọn vẹn ở tên; đội chỉ khớp rời rạc nên đứng sau.
    expect(results.map((r) => r.slug)).toEqual(['sgp-hcm', 'saigon-phantom']);
  });

  it('một từ không xuất hiện ở đâu thì không trả về gì', async () => {
    seedFile(PLAYERS, []);
    seedFile(TEAMS, [makeTeam()]);
    seedFile(TOURNAMENTS, []);
    listFromFiles();

    expect(await searchAll('sgp ha noi')).toEqual([]);
  });

  it('vẫn tìm được giải đấu theo ban tổ chức + địa điểm', async () => {
    seedFile(PLAYERS, []);
    seedFile(TEAMS, []);
    seedFile(TOURNAMENTS, [makeTournament()]);
    listFromFiles();

    expect((await searchAll('garena hcm')).map((r) => r.slug)).toEqual(['aic']);
  });
});
