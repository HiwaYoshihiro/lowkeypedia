/**
 * Dashboard: gỡ setState đồng bộ khỏi thân effect.
 *
 * Phần tải dữ liệu được đưa ra hàm module `loadDashboardData()` (thuần, không
 * setState); effect chỉ gắn callback `.then()/.catch()/.finally()`, còn nút
 * "Tải lại" dùng `reload` — nhờ vậy không còn setState đồng bộ ngay trong effect.
 */
const fs = require('node:fs');
const path = require('node:path');

const p = path.join(process.cwd(), 'app/admin/dashboard/page.tsx');
let text = fs.readFileSync(p, 'utf8');
const N = '\r\n';

function must(find) {
  if (!text.includes(find)) throw new Error(`thiếu mẫu: ${JSON.stringify(find.slice(0, 60))}`);
}

// 1) Thêm interface + hàm tải dữ liệu ở phạm vi module, ngay sau khai báo `Tab`.
const anchor = `type Tab = 'players' | 'teams' | 'tournaments';`;
must(anchor);
text = text.replace(
  anchor,
  [
    anchor,
    '',
    'interface DashboardData {',
    '  players: Player[];',
    '  teams: Team[];',
    '  tournaments: Tournament[];',
    '}',
    '',
    '/** Tải toàn bộ dữ liệu quản trị; trả `\'unauthorized\'` khi phiên admin đã hết hạn. */',
    'async function loadDashboardData(): Promise<DashboardData | \'unauthorized\'> {',
    '  const [pr, tr, tor] = await Promise.all([',
    "    fetch('/api/admin/players'),",
    "    fetch('/api/admin/teams'),",
    "    fetch('/api/admin/tournaments'),",
    '  ]);',
    '  if (pr.status === 401 || tr.status === 401 || tor.status === 401) return \'unauthorized\';',
    "  if (!pr.ok || !tr.ok || !tor.ok) throw new Error('Không tải được dữ liệu');",
    '  return {',
    '    players: (await pr.json()) as Player[],',
    '    teams: (await tr.json()) as Team[],',
    '    tournaments: (await tor.json()) as Tournament[],',
    '  };',
    '}',
  ].join(N),
);

// 2) Thay khối load/reload/effect cũ bằng effect dùng promise + `reload` mới.
const oldBlock = [
  '  // Không setState đồng bộ ở đầu `load`: effect gọi nó ngay sau mount, và',
  '  // setState đồng bộ trong thân effect tạo thêm một vòng render thừa. Cờ',
  "  // `loading` đã khởi tạo `true`; khi người dùng bấm tải lại, `reload` bật cờ trước.",
  '  const load = useCallback(async () => {',
  '    try {',
  '      const [pr, tr, tor] = await Promise.all([',
  "        fetch('/api/admin/players'),",
  "        fetch('/api/admin/teams'),",
  "        fetch('/api/admin/tournaments'),",
  '      ]);',
  '      if (pr.status === 401 || tr.status === 401 || tor.status === 401) {',
  "        router.push('/admin');",
  '        return;',
  '      }',
  "      if (!pr.ok || !tr.ok || !tor.ok) throw new Error('Không tải được dữ liệu');",
  '      setPlayers(await pr.json());',
  '      setTeams(await tr.json());',
  '      setTournaments(await tor.json());',
  '    } catch (e) {',
  "      setError(e instanceof Error ? e.message : 'Lỗi không xác định');",
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  }, [router]);',
  '',
  '  const reload = useCallback(async () => {',
  '    setLoading(true);',
  "    setError('');",
  '    await load();',
  '  }, [load]);',
  '',
  '  useEffect(() => {',
  '    void load();',
  '  }, [load]);',
].join(N);
must(oldBlock);

const newBlock = [
  '  // Nạp dữ liệu ban đầu trong effect: chỉ gắn callback của promise, không gọi',
  '  // một hàm có setState ngay trong thân effect.',
  '  useEffect(() => {',
  '    let alive = true;',
  '    loadDashboardData()',
  '      .then((data) => {',
  '        if (!alive) return;',
  "        if (data === 'unauthorized') {",
  "          router.push('/admin');",
  '          return;',
  '        }',
  '        setPlayers(data.players);',
  '        setTeams(data.teams);',
  '        setTournaments(data.tournaments);',
  '      })',
  '      .catch((e: unknown) => {',
  "        if (alive) setError(e instanceof Error ? e.message : 'Lỗi không xác định');",
  '      })',
  '      .finally(() => {',
  '        if (alive) setLoading(false);',
  '      });',
  '    return () => {',
  '      alive = false;',
  '    };',
  '  }, [router]);',
  '',
  '  const reload = useCallback(async () => {',
  '    setLoading(true);',
  "    setError('');",
  '    try {',
  '      const data = await loadDashboardData();',
  "      if (data === 'unauthorized') {",
  "        router.push('/admin');",
  '        return;',
  '      }',
  '      setPlayers(data.players);',
  '      setTeams(data.teams);',
  '      setTournaments(data.tournaments);',
  '    } catch (e) {',
  "      setError(e instanceof Error ? e.message : 'Lỗi không xác định');",
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  }, [router]);',
].join(N);
text = text.replace(oldBlock, newBlock);

// 3) Chỗ khác còn gọi `load()` thì đổi sang `reload()`.
text = text.split('await load();').join('await reload();');

fs.writeFileSync(p, text);
console.log('✓ app/admin/dashboard/page.tsx');
