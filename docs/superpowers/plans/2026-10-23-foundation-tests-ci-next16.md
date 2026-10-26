# Kế hoạch thực hiện: Nền tảng — Tests + CI + Nâng cấp Next.js 16

> **Cho agent thực thi:** BẮT BUỘC dùng skill con: superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực hiện plan này từng task một. Các bước dùng cú pháp checkbox (`- [ ]`).

**Mục tiêu:** Xây bộ test tối đa (Vitest + Playwright), CI GitHub Actions, và nâng cấp LWKYPEDIA từ Next.js 14 lên Next.js 16.2.x + React 19.2 với mọi test xanh trước và sau nâng cấp.

**Kiến trúc:** Test xanh trên Next 14 trước (lưới an toàn) → codemod + sửa tay lên Next 16 → test vẫn xanh → CI 5 job (lint/typecheck/unit/build/e2e). E2E admin chạy trên Blob store test riêng, không bao giờ đụng production.

**Tech stack:** Next.js 16.2.x, React 19.2, TypeScript 5.x, Vitest 3 + @testing-library/react + jsdom, Playwright, ESLint 9 flat config, GitHub Actions, Node 22 (CI).

**Spec:** `docs/superpowers/specs/2026-10-23-foundation-tests-ci-next16-design.md`

## Trạng thái thực thi

Kế hoạch đã chạy xong toàn bộ; các checkbox bên dưới giữ nguyên như lúc lập kế hoạch, trạng thái thật ghi ở đây.

- **Task 1–7:** hoàn tất — bộ unit test Vitest + e2e Playwright, hiện **39 file / 219 test xanh**.
- **Task 8:** hoàn tất — `next@16.4.3`, `react@19.3.1`, `eslint@9.39.5` + `eslint.config.mjs` flat config, `next.config.ts`, `lib/auth.ts` dùng `await cookies()`, route/page nhận `params`/`searchParams` dạng Promise. Bản cài thực tế mới hơn con số trong plan (16.4.x/19.3.x thay vì 16.2/19.2).
- **Task 9:** hoàn tất — `.github/workflows/ci.yml` 5 job (lint, typecheck, unit, build, e2e) trên Node 22.
- **Bổ sung ngoài plan (đợt rà soát sau đó):**
  - CSP theo nonce cho mọi route trong `proxy.ts` (Next 16 đổi tên `middleware` → `proxy`); script khởi tạo theme tách sang `public/theme-init.js` để CSP không phải mở cho inline script.
  - `GET /api/admin/export` (sao lưu JSON) + `docs/backup.md`.
  - `searchAll` xếp hạng theo độ khớp (trùng khít > đầu từ > giữa chuỗi; khớp ở tên > trường phụ), tối đa 20 kết quả; truy vấn nhiều từ rải ở nhiều trường vẫn khớp nhưng xếp sau; `/api/search` giới hạn 60 request/phút mỗi IP.
  - `app/admin/dashboard/page.tsx` tách từ ~950 dòng còn ~390 dòng, phần còn lại nằm trong `app/admin/dashboard/_components/`.
- **Kiểm chứng cuối:** `npx eslint .` 0 error/0 warning · `npx tsc --noEmit` sạch · `npx vitest run` 39 file / 219 test · `npx next build` 23 route · chạy `next start` kiểm CSP nonce, `/theme-init.js`, `/api/search`, `/api/admin/export` (401 khi chưa đăng nhập) và các trang chính trả 200.

## Global Constraints

- Node ≥ 20.9 để dev (CI chạy Node 22 LTS); package.json có `"engines": { "node": ">=20.9.0" }`.
- Coverage (dòng — lines): `lib/**` ≥ 90%, `components/**` ≥ 80%, tổng (trên lib+components) ≥ 80%.
- Hành vi người dùng cuối KHÔNG đổi. Thay đổi code sản phẩm duy nhất: biến môi trường `LOGIN_RATE_LIMIT_MAX` (mặc định giữ hành vi hiện tại = 8 lần/10 phút).
- Mọi test chỉ dùng dữ liệu seed hoặc Blob store test (`BLOB_READ_WRITE_TOKEN_TEST`) — tuyệt đối không ghi store production.
- Package manager: npm (`npm install`/`npm ci`). Commit sau mỗi task, message tiếng Việt ngắn gọn theo lịch sử repo.
- State cuối: `next@^16.2`, `react@^19.2`, `react-dom@^19.2`, `eslint@^9` + flat config, `next.config.ts` (Turbopack), không còn `.eslintrc.json`, script `lint` = `eslint .`.

## Review Focus

Các điều kiện biên dễ làm hỏng trải nghiệm người dùng mà spec không mô tả từng chi tiết — mỗi dòng được ghim bằng test trong task sở hữu code:

1. **Tìm kiếm không dấu hai chiều và ký tự regex đặc biệt** — `normalizeSearch('Lai Bâng') === 'lai bang'`; tên chứa `(`, `+`, `*` (regex escape trong mentions) không làm hỏng khớp. → Task 1.
2. **Cookie admin bị sửa/giả mạo/hết hạn phải bị từ chối** — cookie đổi 1 ký tự, cookie hết TTL 7 ngày, cookie sai định dạng đều khiến `isAdmin()` trả false. → Task 2.
3. **Slug trùng khi tạo/sửa** — entity thứ hai cùng tên phải nhận hậu tố `-2`, `-3`… chứ không ghi đè entity thứ nhất; slugify rỗng → `untitled`. → Task 3.
4. **Blob lỗi tạm thời không được seed-đè dữ liệu thật** — đang có dữ liệu thật trong cache mà lần đọc sau lỗi mạng thì vẫn phục vụ bản thật; luồng ghi phải ném lỗi (không PUT) khi chỉ đọc được seed tạm. → Task 3.
5. **Rate limit mặc định vẫn 8 lần; `LOGIN_RATE_LIMIT_MAX` override hoạt động** — không đặt env → chặn sau 8 lần sai; đặt `3` → chặn sau 3. → Task 2 (unit) + Task 6 (e2e).
6. **Theme không nháy (FOUC) và ép theme qua URL** — `?theme=dark` phải tối ngay từ lần vẽ đầu (script trong `<head>`), toggle ghi `localStorage` và giữ sau reload. → Task 5.

---

### Task 1: Hạ tầng Vitest + unit test các lib thuần túy

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `tests/unit/slug.test.ts`, `tests/unit/params.test.ts`, `tests/unit/entities.test.ts`, `tests/unit/site.test.ts`, `tests/unit/mentions.test.ts`
- Modify: `package.json` (scripts + devDependencies)

**Interfaces:**
- Produces (mọi task sau dùng): `vitest.config.ts` với alias `@/*` → `./*`, environment `jsdom`, `setupFiles: ['./vitest.setup.ts']`, `include: ['tests/unit/**/*.test.{ts,tsx}']`, coverage provider `v8`, `include: ['lib/**/*.ts', 'components/**/*.tsx']`, thresholds `{ lines: 80, 'lib/**/*.ts': { lines: 90 }, 'components/**/*.tsx': { lines: 80 } }`.
- Produces: scripts `"test": "vitest run"`, `"test:unit": "vitest run"`, `"test:coverage": "vitest run --coverage"` (script `test:e2e` thêm ở Task 5).

- [ ] **Bước 1: Cài devDependencies**

`npm install -D vitest @vitest/coverage-v8 vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event`

- [ ] **Bước 2: Tạo `vitest.config.ts` và `vitest.setup.ts`**

Config theo đúng phần "Produces" ở trên (import `react` plugin từ `@vitejs/plugin-react`, `tsconfigPaths` từ `vite-tsconfig-paths`). Setup file: `import '@testing-library/jest-dom/vitest'` + `afterEach(cleanup)` (cleanup từ `@testing-library/react`).

- [ ] **Bước 3: Thêm scripts vào `package.json`** — `test`, `test:unit`, `test:coverage` như phần Produces.

- [ ] **Bước 4: Viết `tests/unit/slug.test.ts`**

Test + assertion chính:
- `slugify('Lai Bâng') === 'lai-bang'`; `slugify('  Đấu Trường   Danh Vọng ') === 'dau-truong-danh-vong'`; `slugify('A&B (2025)') === 'a-b-2025'`; `slugify('') === ''`; chuỗi toàn ký tự đặc biệt → `''`.
- `normalizeSearch('Lai Bâng') === 'lai bang'`; `normalizeSearch('ĐTDV') === 'dtdv'`; giữ nguyên chữ số và dấu cách.

- [ ] **Bước 5: Viết `tests/unit/params.test.ts`**

- `firstParam('a') === 'a'`; `firstParam(['a','b']) === 'a'`; `firstParam(undefined) === ''`.
- `stripMarkdown('**Vô địch**  AIC  \n 2025') === 'Vô địch AIC 2025'`; chuỗi dài 200 ký tự → đúng 160 ký tự, cắt giữa từ cũng được; `stripMarkdown(123) === ''`; `stripMarkdown(null) === ''`.

- [ ] **Bước 6: Viết `tests/unit/entities.test.ts`**

- `KIND_HREF.player('lai-bang') === '/tuyen-thu/lai-bang'`; tương tự `team` → `/doi-tuyen/…`, `tournament` → `/giai-dau/…`.
- `KIND_LABEL.tournament === 'Giải đấu'`; `KIND_ORDER` đúng thứ tự `['player','team','tournament']`.

- [ ] **Bước 7: Viết `tests/unit/site.test.ts`** (env đọc lúc module load → dùng `vi.stubEnv` + `vi.resetModules` + `await import('@/lib/site')` trong từng test)

- Không env: `SITE_NAME === 'LWKYPEDIA'`, `SITE_NAME_HEAD === 'LWKY'`, `SITE_NAME_TAIL === 'PEDIA'`, `SITE_URL === 'https://lwkypedia.vercel.app'`.
- `vi.stubEnv('NEXT_PUBLIC_SITE_NAME', 'LIÊN QUÂN WIKI')` → `SITE_NAME` đúng giá trị override; `NEXT_PUBLIC_SITE_URL` → `SITE_URL` override.

- [ ] **Bước 8: Viết `tests/unit/mentions.test.ts`**

- `segmentMentions('2025 — Vô địch: Saigon Phantom', { teams: [{name:'Saigon Phantom', slug:'saigon-phantom'}], players: [] })` → segment giữa có `slug: 'saigon-phantom'`, `kind: 'team'`.
- Tuyển thủ theo IGN: `segmentMentions('FMVP: Khoa', { teams: [], players: [{ign:'Khoa', slug:'khoa'}] })` → `kind: 'player'`.
- Tên dài thắng: sources có `Flash` và `Team Flash`, text `Team Flash` → khớp `Team Flash` (một segment), không tách thành `Team` + `Flash`.
- Ranh giới từ: text `HEAVYmetal` với source `HEAVY` → KHÔNG khớp.
- Tên có ký tự regex đặc biệt `Team (A)` trong sources vẫn khớp nguyên văn.
- Trùng tên team/player → ưu tiên team; text rỗng → `[]`; sources rỗng → `[{ text }]`.

- [ ] **Bước 9: Chạy test và verify**

Run: `npm run test:unit`
Expected: PASS toàn bộ, không có file nào fail.

- [ ] **Bước 10: Commit**

```bash
git add vitest.config.ts vitest.setup.ts tests/unit/ package.json package-lock.json
git commit -m "test: ha tang Vitest + unit test lib thuan tuy"
```

---

### Task 2: Unit test auth + ratelimit (+ `LOGIN_RATE_LIMIT_MAX`) + http + revalidate + route login

**Files:**
- Modify: `lib/ratelimit.ts` (đọc max từ env)
- Create: `tests/unit/auth.test.ts`, `tests/unit/ratelimit.test.ts`, `tests/unit/http.test.ts`, `tests/unit/revalidate.test.ts`, `tests/unit/login-route.test.ts`
- Modify: `.env.example` (thêm dòng `LOGIN_RATE_LIMIT_MAX=`)

**Interfaces:**
- Produces: `lib/ratelimit.ts` — `const MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 8) || 8;` (mọi export hiện có giữ nguyên: `clientIp`, `isRateLimited`, `noteFailure`, `noteSuccess`).
- Consumes: test infra từ Task 1.

- [ ] **Bước 1: Sửa `lib/ratelimit.ts`** — thay hằng `MAX_ATTEMPTS = 8` bằng dòng ở phần Produces, giữ comment giải thích dùng cho test.

- [ ] **Bước 2: Viết `tests/unit/ratelimit.test.ts`**

- `clientIp`: request có `x-forwarded-for: '1.2.3.4, 10.0.0.1'` → `'1.2.3.4'`; chỉ có `x-real-ip` → giá trị đó; không có header → `'unknown'`.
- Mặc định (không env): `noteFailure` 7 lần → `isRateLimited` false; lần 8 → true.
- `vi.stubEnv('LOGIN_RATE_LIMIT_MAX', '3')` + `vi.resetModules` + dynamic import: chặn sau 3 lần.
- Window: `vi.useFakeTimers` + `vi.setSystemTime`, `noteFailure` rồi tiến 11 phút → `isRateLimited` false.
- `noteSuccess(key)` xoá bộ đếm → không còn limited. Dùng key khác nhau mỗi test để cách ly (buckets là module-level).

- [ ] **Bước 3: Viết `tests/unit/auth.test.ts`** (mock `next/headers`; `vi.mock('next/headers', () => ({ cookies: vi.fn() }))`; mock cookies() trả `{ get, set }` do test điều khiển; `vi.stubEnv` `ADMIN_SECRET` (32 ký tự) + `ADMIN_PASSWORD` trước khi dynamic import `@/lib/auth`)

- `verifyPassword`: đúng mật khẩu → true; sai → false; thiếu `ADMIN_PASSWORD` → throw.
- Vòng khép kín: gọi `setAdminCookie()` → bắt giá trị từ mock `set` → cho `cookies().get` trả giá trị đó → `isAdmin()` true.
- Cookie bị sửa 1 ký tự (sig) → `isAdmin()` false; sai định dạng (`abc`, `abc.def.ghi`) → false; hết hạn: `vi.useFakeTimers` đặt thời gian, `setAdminCookie`, tiến 8 ngày → false.
- `setAdminCookie` mock `set` nhận options: `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 604800`, `path: '/'`.
- `requireAdmin()`: không có cookie → `Response` status 401, body `{ error: 'Chưa đăng nhập quản trị' }`; có cookie hợp lệ → null.

- [ ] **Bước 4: Viết `tests/unit/http.test.ts`** (dòng đầu file: `// @vitest-environment node`; spy `console.error`)

- `failure(new ValidationError('Vị trí (role) không hợp lệ'), 'Lưu thất bại')` → status 400, JSON `{ error: 'Vị trí (role) không hợp lệ' }`.
- `failure(new Error('x'), 'Lưu thất bại')` → status 500, JSON `{ error: 'Lưu thất bại' }`; `console.error` được gọi.

- [ ] **Bước 5: Viết `tests/unit/revalidate.test.ts`**

- `vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))`; gọi `revalidateSite()` → `revalidatePath` được gọi đúng 1 lần với `('/', 'layout')`.

- [ ] **Bước 6: Viết `tests/unit/login-route.test.ts`** (mock `@/lib/auth` `{ setAdminCookie: vi.fn(), verifyPassword: vi.fn() }` và `@/lib/ratelimit` giữ nguyên hàm thật qua `vi.importActual` cho `clientIp`/`noteFailure`/`noteSuccess`, riêng `isRateLimited` mock về false mặc định)

- `isRateLimited` true → POST trả 429, body `{ error: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.' }`.
- `verifyPassword` false → 401 `{ error: 'Mật khẩu không đúng' }`; `noteFailure` được gọi; `setAdminCookie` không gọi.
- `verifyPassword` true → 200 `{ ok: true }`; `setAdminCookie` gọi 1 lần; `noteSuccess` gọi.
- Body không phải JSON → 401 (không crash); `verifyPassword` throw → 500 `{ error: 'Không đăng nhập được' }`.

- [ ] **Bước 7: Cập nhật `.env.example`** — thêm dòng có comment: `# (Tuỳ chọn, dùng cho test) Số lần thử đăng nhập sai tối đa trong 10 phút. Mặc định 8.`

- [ ] **Bước 8: Chạy test và verify**

Run: `npm run test:unit`
Expected: PASS toàn bộ.

- [ ] **Bước 9: Commit**

```bash
git add lib/ratelimit.ts tests/unit/ .env.example
git commit -m "test: unit test auth + ratelimit + http + login route; them LOGIN_RATE_LIMIT_MAX"
```

---

### Task 3: Unit test `lib/store.ts` với Blob giả trong bộ nhớ

**Files:**
- Create: `tests/unit/helpers/fake-blob.ts`, `tests/unit/store.test.ts`

**Interfaces:**
- Produces: `tests/unit/helpers/fake-blob.ts` export `mockList`, `mockPut` (các `vi.fn` hoisted dùng trong `vi.mock('@vercel/blob')`), `installFakeFetch()` trả `store: { files: Map<string,string>, failNextRead: boolean }` (stub `globalThis.fetch` đọc từ `store.files` theo pathname của URL, bỏ qua query cache-bust; trả `Response` 200/404; khi `store.failNextRead === true` thì ném `Error('network down')`), `resetFakeBlob()` (xoá files + tắt flag, `mockClear` cả hai fn, `clearCache()` từ `@/lib/store`).
- Consumes: `slugify`/`normalizeSearch` (Task 1), `ValidationError` trong store.

- [ ] **Bước 1: Viết `tests/unit/helpers/fake-blob.ts`**

Dùng `vi.hoisted` cho `mockList`/`mockPut`; `mockList` mặc định trả `{ blobs: [] }`, test set `mockList.mockResolvedValue({ blobs: [...] })` với mỗi blob `{ pathname: 'lowkeypedia/data/players.json', url: 'https://blob.test/lowkeypedia/data/players.json' }`. `installFakeFetch` parse URL → pathname → trả nội dung từ map; flag `failNextRead` ném `Error('network down')`. Hàm reset cũng reset `generation` qua `clearCache`.

- [ ] **Bước 2: Viết `tests/unit/store.test.ts`** — pattern chung: `beforeEach` `vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token')` + `vi.resetModules()`; import store qua `await import('@/lib/store')` TRONG test; `afterEach` `resetFakeBlob()` + `vi.unstubAllEnvs()`. Nạp fixture bằng `files.set('lowkeypedia/data/players.json', JSON.stringify([…]))` + `mockList` trả blob tương ứng.

Các test + assertion:

1. **Không có token → seed, không gọi mạng**: unstub token; `getPlayers()` trả nội dung seed (`data/seed/players.json`); `mockList` không gọi; `mockPut` không gọi.
2. **File chưa tồn tại → tự seed lần đầu**: `mockList` trả `{ blobs: [] }`; `getPlayers()` trả seed; `mockPut` gọi với path `lowkeypedia/data/players.json`, options `{ access:'public', addRandomSuffix:false, allowOverwrite:true, contentType:'application/json' }`.
3. **Cache SWR — hit trong TTL**: nạp fixture "A1"; `getPlayers()` 2 lần liên tiếp → `mockList` chỉ gọi 1 lần.
4. **Hết TTL → trả bản cũ ngay, làm mới nền**: `vi.useFakeTimers`; get lần 1 (fixture A1) → đổi file thành A2 → tiến 31 giây → `getPlayers()` trả A1 ngay (không chờ), sau `await vi.runAllTimersAsync()` + microtask → get lần 3 trả A2. (`cache()` React ngoài render không memo nên gọi thẳng store qua `getPlayers` vẫn đúng hành vi cache dưới.)
5. **Review Focus 4 — lỗi mạng giữ bản thật**: get lần 1 thành công (A1, trusted); bật `failNextRead`; tiến 31 giây; get trả A1 (không phải seed); tắt flag, tiến tiếp → refresh lấy A1 từ Blob.
6. **`searchAll` không dấu**: fixture players chứa `{ ign: 'Lai Bâng', role: 'Đi Rừng', … }`; `searchAll('lai bang')` → 1 kết quả `{ type:'player', slug, title:'Lai Bâng' }`; `searchAll('   ')` → `[]`.
7. **`savePlayer` tạo mới**: gọi `savePlayer({ ign: 'Tester', role: 'Trợ Thủ' })` → trả về object có `slug === 'tester'`, `id` bắt đầu `player-`, `updatedAt` là ISO; `mockPut` gọi với file chứa đúng 1+ player; sau đó `getPlayers()` thấy entity.
8. **Review Focus 3 — slug trùng sinh hậu tố**: nạp fixture có sẵn player slug `tester`; `savePlayer({ ign: 'Tester', role: 'Xạ Thủ' })` → slug `tester-2`; tên rỗng → slug `untitled`.
9. **Role không hợp lệ → `ValidationError`**: `savePlayer({ ign:'X', role:'Làm vườn' as never })` reject với `ValidationError`, message `'Vị trí (role) không hợp lệ'`.
10. **`saveTeam` đổi slug → cascade player refs**: fixture team `a` (id `t1`) + player có `teamSlug:'a'` và `teamHistory:[{period:'2024', team:'A', teamSlug:'a'}]`; `saveTeam({ id:'t1', name:'A Mới' })` → player trong file sau khi ghi có `teamSlug:'a-moi'`, `teamHistory[0].teamSlug:'a-moi'`.
11. **`deleteTeam` → gỡ refs**: xoá team `a` → player còn `teamSlug:null`, `teamHistory[0]` không còn key `teamSlug`.
12. **`saveTournament` đổi slug → cascade achievements**: tournament `aic` (id `g1`) + player & team có achievement `tournamentSlug:'aic'`; `saveTournament({ id:'g1', name:'AIC 2026' })` → cả players.json lẫn teams.json đều có `tournamentSlug:'aic-2026'`.
13. **`deleteTournament` → bỏ `tournamentSlug`** khỏi achievements (không còn key).
14. **Review Focus 4 — ghi từ chối khi chỉ đọc được seed**: `failNextRead = true` trước `savePlayer` → reject với message chứa `'Không đọc được dữ liệu mới nhất từ Blob'`; `mockPut` không gọi (trừ lần seed).
15. **Delete entity không tồn tại** → `false`, không PUT.

- [ ] **Bước 3: Chạy test và verify**

Run: `npm run test:unit`
Expected: PASS toàn bộ.

- [ ] **Bước 4: Commit**

```bash
git add tests/unit/helpers/fake-blob.ts tests/unit/store.test.ts
git commit -m "test: unit test store voi Blob gia — SWR, cascade slug, ghi an toan"
```

---

### Task 4: Test toàn bộ components + smoke test trang RSC

**Files:**
- Create: `tests/unit/components/` — 1 file test cho mỗi component trong `components/` (18 file): `AchievementTable`, `ArticleShell`, `Badges`, `Breadcrumb`, `EntityCard`, `Footer`, `Infobox`, `JsonLd`, `Mentions`, `PlayerCard`, `RichText`, `SearchBox`, `SectionBlock`, `SiteChrome`, `TeamCard`, `ThemeToggle`, `TournamentCard`, `WikiTable`
- Create: `tests/unit/pages/` — `home.test.tsx`, `player-detail.test.tsx`, `team-detail.test.tsx`, `tournament-detail.test.tsx`, `players-list.test.tsx`, `tim-kiem.test.tsx`

**Interfaces:**
- Consumes: test infra (Task 1); fixture player/team/tournament dùng chung — đặt trong `tests/unit/helpers/fixtures.ts` (tạo ở bước 1): `fixturePlayer`, `fixtureTeam`, `fixtureTournament` hợp lệ đầy đủ (có achievements, teamHistory, results) với slug cố định `lai-bang`, `saigon-phantom`, `aic-2025`.
- Pattern mock: `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }), usePathname: () => '/', notFound: vi.fn() }))`; `vi.mock('next/link', …)` KHÔNG cần — dùng Link thật.

- [ ] **Bước 1: Tạo `tests/unit/helpers/fixtures.ts`** — 3 fixture theo đúng type trong `lib/types.ts` (thêm cả `updatedAt` ISO).

- [ ] **Bước 2: Viết test các component trình bày** (AchievementTable, WikiTable, RichText, Mentions, Infobox, SectionBlock, Badges, Breadcrumb, EntityCard, PlayerCard, TeamCard, TournamentCard, ArticleShell, Footer, JsonLd)

Mỗi file test theo cùng mẫu: render với fixture → assert. Các assertion quan trọng:
- `AchievementTable`: render dòng Năm/Thứ hạng/Giải đấu; dòng có `tournamentSlug` → link `href="/giai-dau/<slug>"`; dòng không có slug → không link.
- `WikiTable`: render đủ headers + rows từ props.
- `RichText`: `'Đội **vô địch** AIC'` → chứa `<strong>vô địch</strong>`; text thường giữ nguyên; input rỗng → render rỗng không crash.
- `Mentions`: segment có `slug` → thẻ `a` với `href` đúng theo `kind` (`/doi-tuyen/…` hoặc `/tuyen-thu/…`); segment thường → text không link.
- `Infobox`: render đúng label/value từng dòng; khi props có `avatarUrl`/`logoUrl` → render `img` với src và `alt` mô tả.
- `SectionBlock`: render tiêu đề + children.
- `Badges`: render chip role/nationality/region.
- `Breadcrumb`: item cuối không phải link, item trước là link.
- `EntityCard`/`PlayerCard`/`TeamCard`/`TournamentCard`: tiêu đề là link tới href đúng slug.
- `ArticleShell`: render tiêu đề + breadcrumb + children.
- `Footer`: chứa `SITE_NAME` và dòng ghi chú phi thương mại.
- `JsonLd`: `document.querySelector('script[type="application/ld+json"]')` tồn tại; `JSON.parse` nội dung có `@type` đúng (`Person`/`SportsTeam`/`SportsEvent`/`BreadcrumbList`) theo props.

- [ ] **Bước 3: Viết `tests/unit/components/SearchBox.test.tsx`** (`vi.useFakeTimers` + `userEvent`; mock `globalThis.fetch` trả kết quả mẫu)

- Gõ `'lai'` → sau 180ms debounce gọi `fetch('/api/search?q=lai')`; hiện `listbox` với nhóm "Tuyển thủ".
- Gõ rỗng → không gọi fetch; xoá nội dung → panel ẩn.
- Phản hồi lỗi HTTP 500 → hiện "Không tìm thấy kết quả cho …" không crash.
- Response cũ về sau response mới bị bỏ qua: gõ `'a'` rồi `'ab'`, resolve response cũ trước → không ghi đè kết quả mới.
- `ArrowDown` 2 lần + `Enter` → `pushMock` gọi với href đúng của item highlight; `Escape` → panel đóng; nút "Xem tất cả kết quả" → `pushMock('/tim-kiem?q=lai')`.

- [ ] **Bước 4: Viết `tests/unit/components/ThemeToggle.test.tsx` và `SiteChrome.test.tsx`**

- ThemeToggle: click → `document.documentElement.dataset.theme === 'dark'`, `localStorage.getItem('theme') === 'dark'`; click lần nữa → `'light'`.
- SiteChrome: render 5 mục NAV đúng nhãn; `usePathname` mock `'/tuyen-thu'` → link Tuyển thủ có `aria-current="page"`; click nút `Mở menu` → `aria-expanded` true và sidebar có class `is-open`; có skip-link `Tới nội dung chính`.

- [ ] **Bước 5: Viết smoke test trang RSC (`tests/unit/pages/*`)** — mock `@/lib/store`: `vi.mock('@/lib/store', () => ({ getPlayers: vi.fn(async () => [fixturePlayer]), getTeams: …, getTournaments: …, getPlayerBySlug: vi.fn(async (slug) => slug === 'lai-bang' ? fixturePlayer : null), getTeamBySlug: …, getTournamentBySlug: …, getPlayersByTeam: …, searchAll: … }))`

- Home: render `await Page()` → có heading trang chủ và mục "Cập nhật gần đây".
- Detail (3 loại): render `await Page({ params: { slug: '…' } })` → infobox/tiêu đề chứa tên entity; slug không tồn tại → `notFound` được gọi.
- `generateMetadata` của mỗi detail page: gọi với params đúng → title chứa tên entity.
- List players: `await Page({ searchParams: { team: 'saigon-phantom', role: 'Đi Rừng', q: 'lai' } })` → chỉ hiện player khớp (mock `getPlayersByTeam`/filter qua fixture).
- `tim-kiem`: `await Page({ searchParams: { q: 'lai' } })` → hiện kết quả từ `searchAll` mock.

- [ ] **Bước 6: Chạy test và verify**

Run: `npm run test:unit`
Expected: PASS toàn bộ.

- [ ] **Bước 7: Commit**

```bash
git add tests/unit/
git commit -m "test: component tests (18) + smoke test trang RSC"
```

---

### Task 5: Hạ tầng Playwright + e2e giao diện công khai

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/public.spec.ts`, `tests/e2e/details.spec.ts`, `tests/e2e/search.spec.ts`, `tests/e2e/theme.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/404.spec.ts`
- Modify: `package.json` (script `"test:e2e": "npm run build && playwright test"`), `.gitignore` (thêm `playwright-report/`, `test-results/`)

**Interfaces:**
- Produces: `playwright.config.ts` — đầu file `import dotenv from 'dotenv'; dotenv.config({ path: '.env.test.local' });` (có file thì nạp, không có thì bỏ qua). 3 webServer (mỗi cái `command: 'npm run start -- -p <port>'`, `reuseExistingServer: !process.env.CI`):
  1. `public` — port 3100, env rỗng (không Blob token → seed read-only).
  2. `admin` — port 3101, env `BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN_TEST`, `ADMIN_PASSWORD: process.env.ADMIN_PASSWORD_TEST`, `ADMIN_SECRET: process.env.ADMIN_SECRET_TEST`, `LOGIN_RATE_LIMIT_MAX: '200'`.
  3. `admin-ratelimit` — port 3102, giống admin nhưng `LOGIN_RATE_LIMIT_MAX: '3'`.
  Projects: `public` (testMatch `tests/e2e/{public,details,search,theme,seo,404}.spec.ts`, baseURL `http://localhost:3100`), `admin` (`tests/e2e/admin.spec.ts`, baseURL 3101), `admin-ratelimit` (`tests/e2e/ratelimit.spec.ts`, baseURL 3102). Nếu thiếu bất kỳ env `BLOB_READ_WRITE_TOKEN_TEST`/`ADMIN_PASSWORD_TEST`/`ADMIN_SECRET_TEST` → lọc bỏ project `admin` và `admin-ratelimit` khỏi config (local chạy công khai không cần secret). Browser: chromium. `use: { trace: 'retain-on-failure', video: 'retain-on-failure' }`.
- Consumes: server build qua script `test:e2e` (build 1 lần trước, 3 server dùng chung `.next`).

- [ ] **Bước 1: Cài devDependencies** — `npm install -D @playwright/test dotenv`; `npx playwright install chromium` (CI sẽ dùng `--with-deps`).

- [ ] **Bước 2: Tạo `playwright.config.ts`** đúng mô tả ở Produces.

- [ ] **Bước 3: Thêm script `test:e2e` và cập nhật `.gitignore`.**

- [ ] **Bước 4: Viết `tests/e2e/public.spec.ts`** (trang chủ + danh sách)

- Trang chủ: hero/h1 chứa `LWKYPEDIA`; hiện các mục "Tuyển thủ", "Đội tuyển", "Giải đấu", "Cập nhật gần đây".
- `/tuyen-thu`: hiện danh sách tuyển thủ từ seed (ít nhất 1 card); filter role (click chip `Xạ Thủ` → danh sách đổi); filter đội.
- `/doi-tuyen` và `/giai-dau`: hiện danh sách tương ứng.

- [ ] **Bước 5: Viết `tests/e2e/details.spec.ts`**

- Lấy slug từ seed: vào `/tuyen-thu` → click card đầu tiên → URL khớp `/tuyen-thu/<slug>` → có infobox và bảng "Thành tích".
- Tương tự đội tuyển (có mục đội hình liên kết tuyển thủ) và giải đấu (mục lịch sử vô địch).

- [ ] **Bước 6: Viết `tests/e2e/search.spec.ts`**

- Ô search ở header: gõ `lai bang` → gợi ý hiện, có mục chứa `Lai Bâng` (nếu seed có — nếu không, dùng tên khác từ seed đọc trong test bằng cách fetch `/api/search?q=…` trước); click gợi ý → sang trang chi tiết.
- Trang `/tim-kiem?q=<từ có trong seed>`: hiện kết quả; `/tim-kiem?q=zzzzzzz` → hiện trạng thái không có kết quả.

- [ ] **Bước 7: Viết `tests/e2e/theme.spec.ts`**

- **Review Focus 6**: mở `/?theme=dark` → `html[data-theme="dark"]` ngay sau load (assert qua `page.evaluate`), không cần click gì.
- Click toggle (aria-label `Chuyển sang giao diện tối`) → `localStorage.theme === 'dark'`; reload → vẫn dark (FOUC test qua `page.addInitScript` capture giá trị `data-theme` ngay lúc `DOMContentLoaded`).

- [ ] **Bước 8: Viết `tests/e2e/seo.spec.ts` và `tests/e2e/404.spec.ts`**

- SEO: `/sitemap.xml` status 200 và chứa ít nhất một `/tuyen-thu/`; `/robots.txt` chứa `Disallow: /admin`; trang chi tiết có `<link rel="canonical">` và `<script type="application/ld+json">`.
- 404: `/tuyen-thu/slug-khong-ton-tai-xyz` → status 404 và hiện trang not-found có đường link về trang chủ.

- [ ] **Bước 9: Chạy test và verify**

Run: `npm run test:e2e`
Expected: project `public` PASS toàn bộ (project admin skip vì chưa có secret).

- [ ] **Bước 10: Commit**

```bash
git add playwright.config.ts tests/e2e/ package.json .gitignore
git commit -m "test: Playwright e2e giao dien cong khai + SEO + theme"
```

---

### Task 6: E2E luồng admin trên Blob store test

**Files:**
- Create: `tests/e2e/admin.spec.ts`, `tests/e2e/ratelimit.spec.ts`

**Interfaces:**
- Consumes: Playwright config 3 server từ Task 5. Yêu cầu trước khi chạy: Blob store test tồn tại và `BLOB_READ_WRITE_TOKEN_TEST` hợp lệ (server tự seed lần đầu khi list rỗng). Local: tạo `.env.test.local` chứa 3 biến test (`BLOB_READ_WRITE_TOKEN_TEST`, `ADMIN_PASSWORD_TEST`, `ADMIN_SECRET_TEST` ≥ 32 ký tự).
- Pattern: mọi thực thể tạo ra có hậu tố `-<Date.now()>`; cuối test xoá qua UI hoặc API.

- [ ] **Bước 1: Viết `tests/e2e/admin.spec.ts`**

1. **Đăng nhập sai**: vào `/admin`, nhập mật khẩu sai → hiện `Mật khẩu không đúng`, vẫn ở `/admin`.
2. **Đăng nhập đúng**: nhập `ADMIN_PASSWORD_TEST` (từ `process.env`) → vào `/admin/dashboard`, thấy 3 tab Tuyển thủ/Đội tuyển/Giải đấu.
3. **CRUD tuyển thủ**: tab Tuyển thủ → nút thêm mới → điền IGN `Test Player <ts>` + role → lưu → thấy trong danh sách; vào form sửa → đổi slug → lưu → GET `/api/admin/players` (dùng `page.request`) thấy `slug` mới; xoá → hết trong danh sách.
4. **CRUD đội tuyển + cascade**: tạo team `Test Team <ts>`; tạo player có "Đội hiện tại" = team đó (select trong form); sửa tên team (đổi slug) → GET `/api/admin/players` thấy `teamSlug` của player đã đổi theo; xoá team → player còn `teamSlug: null`.
5. **CRUD giải đấu + cascade achievement**: tạo tournament `Test Cup <ts>`; sửa player thêm 1 dòng thành tích chọn link giải = tournament đó → lưu; đổi slug tournament → GET `/api/admin/players` thấy `achievements[].tournamentSlug` đổi theo; xoá tournament → slug bị gỡ khỏi achievement.
6. **Logout**: click đăng xuất → về `/admin`.

- [ ] **Bước 2: Viết `tests/e2e/ratelimit.spec.ts`**

- **Review Focus 5**: gửi 4 lần mật khẩu sai (server 3102 có `LOGIN_RATE_LIMIT_MAX=3`) → lần 4 trả 429, hiện `Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.`

- [ ] **Bước 3: Chạy test và verify**

Run: `npm run test:e2e` (đã có `.env.test.local`)
Expected: PASS cả 3 project (public, admin, admin-ratelimit). Lần chạy đầu tiên log server có dòng seed lên Blob test.

- [ ] **Bước 4: Commit**

```bash
git add tests/e2e/admin.spec.ts tests/e2e/ratelimit.spec.ts
git commit -m "test: e2e admin CRUD + cascade + rate limit tren Blob store test"
```

---

### Task 7: Coverage — chạy, vá lỗ hổng tới ngưỡng

**Files:**
- Modify: các file test trong `tests/unit/**` (chỉ thêm test, không sửa code sản phẩm trừ khi phát hiện lỗi thật — lỗi thật thì sửa + thêm test ghim)

- [ ] **Bước 1: Chạy coverage**

Run: `npm run test:coverage`
Expected: in bảng coverage; so với ngưỡng trong `vitest.config.ts` (lib ≥ 90, components ≥ 80, tổng ≥ 80).

- [ ] **Bước 2: Vá lỗ hổng**

Xem báo cáo (bảng terminal hoặc `coverage/index.html`), thêm test cho các nhánh chưa phủ trong `lib/store.ts` (đường `fetch` trả non-ok, `cleanAchievements`/`cleanTeamHistory`/`cleanList` các nhánh input lạ, `uniqueSlug` chuỗi `-3`, cache `retryAt`) và các component chưa đủ (nhánh render rỗng, props thiếu). Mục tiêu: mọi ngưỡng xanh.

- [ ] **Bước 3: Chạy lại và verify**

Run: `npm run test:coverage`
Expected: PASS, không có dòng "ERROR: Coverage … does not meet threshold".

- [ ] **Bước 4: Commit**

```bash
git add tests/
git commit -m "test: bu coverage dat nguong lib 90% / components 80%"
```

---

### Task 8: Nâng cấp Next.js 14 → 16.2 + React 19.2

**Files:**
- Modify: `package.json`, `next.config.js` → xoá + tạo `next.config.ts`, xoá `.eslintrc.json` + tạo `eslint.config.mjs`, `app/tuyen-thu/page.tsx`, `app/tim-kiem/page.tsx`, `app/tuyen-thu/[slug]/page.tsx`, `app/doi-tuyen/[slug]/page.tsx`, `app/giai-dau/[slug]/page.tsx`, `app/api/admin/**/*/route.ts` (9 file, đổi `await requireAdmin()` + `params` thành Promise), `lib/auth.ts` (async cookies), `tests/unit/auth.test.ts` + `tests/unit/login-route.test.ts` (thêm `await` cho API async), các test khác nếu typecheck chỉ ra.

**Interfaces:**
- Produces (state cuối): `lib/auth.ts` — `isAdmin(): Promise<boolean>`, `setAdminCookie(): Promise<void>`, `clearAdminCookie(): Promise<void>`, `requireAdmin(): Promise<Response | null>`; mọi route handler dùng `const denied = await requireAdmin();`.
- Consumes: bộ test xanh từ Task 1–7 là lưới an toàn; codemod `@next/codemod`.

- [ ] **Bước 1: Chạy codemod**

```bash
npx @next/codemod@latest upgrade .
npx @next/codemod@latest next-lint-to-eslint-cli .
```

Sau codemod kiểm tra diff: `params`/`searchParams`/`cookies()` đã thành async; script `lint` đã đổi; `eslint.config.mjs` đã sinh.

- [ ] **Bước 2: Bump dependencies**

```bash
npm install next@^16.2 react@^19.2 react-dom@^19.2
npm install -D @types/react@^19 @types/react-dom@^19 eslint@^9 eslint-config-next@^16 typescript@^5.9
npm install @vercel/blob@latest
```

Xoá `.eslintrc.json`; thêm `"engines": { "node": ">=20.9.0" }` vào `package.json`.

- [ ] **Bước 3: Chuyển `next.config.js` → `next.config.ts`** — giữ nguyên nội dung headers/`reactStrictMode`/`poweredByHeader`, viết kiểu `import type { NextConfig } from 'next'`; xoá file `.js`.

- [ ] **Bước 4: Hoàn thiện `eslint.config.mjs`** — theo mẫu trong docs Next 16 (`defineConfig` + `...nextVitals` + `globalIgnores`) với ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `playwright-report/**`, `test-results/**`, `coverage/**`.

- [ ] **Bước 5: Sửa tay async API còn sót** — chạy `npm run typecheck`, sửa tới khi sạch:

- `lib/auth.ts`: `const store = await cookies()` trong `isAdmin`/`setAdminCookie`/`clearAdminCookie`; `requireAdmin` async.
- 9 file route handler admin: `const denied = await requireAdmin();`; `[id]` route: `{ params }: { params: Promise<{ id: string }> }` + `const { id } = await params;` (thay `params.id`).
- Trang list: `searchParams: Promise<{ … }>` + `const sp = await searchParams;`.
- Trang detail: `params: Promise<{ slug: string }>` + await trong cả `generateMetadata` và Page.
- Cập nhật `tests/unit/auth.test.ts`, `tests/unit/login-route.test.ts`, smoke test trang theo API mới (`await requireAdmin()` nơi cần).

- [ ] **Bước 6: Lint sạch**

Run: `npm run lint`
Expected: 0 lỗi 0 cảnh báo.

- [ ] **Bước 7: Toàn bộ test phải xanh trên Next 16**

Run: `npm run test:coverage` rồi `npm run test:e2e`
Expected: PASS toàn bộ (3 project e2e), coverage vẫn đạt ngưỡng. Nếu Turbopack build lỗi (bước build trong `test:e2e`): thử `next build --webpack`; nếu chỉ webpack build được, ghi chú vào README và giữ webpack tạm thời — KHÔNG giữ nếu Turbopack chỉ cần sửa config nhỏ.

- [ ] **Bước 8: Kiểm tra trực quan bằng screenshot Playwright** — viết script tạm trong `tests/e2e/visual-check.spec.ts` (KHÔNG commit, hoặc để trong `.gitignore`) chụp `page.screenshot` cho `/`, một trang chi tiết tuyển thủ và `/admin` ở cả 2 theme (`?theme=dark`), đối chiếu với ảnh cũ trong `docs/screenshots/`; xác nhận không hồi quy giao diện rồi xoá script.

- [ ] **Bước 9: Commit**

```bash
git add -A
git commit -m "chore: nang cap Next.js 16.2 + React 19.2 + ESLint flat config (test van xanh)"
```

---

### Task 9: CI GitHub Actions + cập nhật README

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `README.md` (mục Script, Bắt đầu — yêu cầu Node, mục mới "Kiểm thử", mục Deploy — thêm secrets test)

**Interfaces:**
- Consumes: scripts `lint`/`typecheck`/`test:coverage`/`test:e2e` từ các task trước; GitHub secrets (chủ dự án tạo, xem bước 4): `BLOB_READ_WRITE_TOKEN_TEST`, `ADMIN_PASSWORD_TEST`, `ADMIN_SECRET_TEST`.

- [ ] **Bước 1: Viết `.github/workflows/ci.yml`**

- `on`: `push` nhánh `main` + `pull_request`; `concurrency` group theo `github.workflow` + `github.ref`, `cancel-in-progress: true`.
- Mọi job: `runs-on: ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` với `node-version: 22`, `cache: npm`, rồi `npm ci`.
- Job `lint`: `npm run lint`.
- Job `typecheck`: `npm run typecheck`.
- Job `unit`: `npm run test:coverage`; `actions/upload-artifact@v4` với path `coverage/`.
- Job `build`: `npm run build`; cache `.next/cache` bằng `actions/cache@v4` (key theo hash `package-lock.json`).
- Job `e2e`: điều kiện bỏ qua khi PR từ fork: `if: github.event_name == 'push' || github.event.pull_request.head.repo.fork == false`; steps thêm `npx playwright install --with-deps chromium`; env từ secrets: `BLOB_READ_WRITE_TOKEN_TEST: ${{ secrets.BLOB_READ_WRITE_TOKEN_TEST }}`, `ADMIN_PASSWORD_TEST: …`, `ADMIN_SECRET_TEST: …`; chạy `npm run test:e2e`; `actions/upload-artifact@v4` path `playwright-report/`, `test-results/` với `if: failure()`.

- [ ] **Bước 2: Cập nhật `README.md`**

- Mục "Bắt đầu": đổi yêu cầu thành Node.js 20.9+ (khuyến nghị 22 LTS).
- Mục "Script": thêm `test`/`test:unit`/`test:e2e`/`test:coverage`, đổi mô tả `lint` thành ESLint CLI.
- Mục mới "Kiểm thử": cách chạy unit/e2e, `.env.test.local` với 3 biến test, tạo Blob store test `lowkeypedia-data-test` trên Vercel, lưu ý không dùng token production.
- Mục "Deploy lên Vercel": thêm bước tạo 3 GitHub secrets và bật required checks (tuỳ chọn).
- Ghi chú kỹ thuật: Turbopack (hoặc fallback `--webpack` nếu bước 7 Task 8 phải dùng).

- [ ] **Bước 3: Verify workflow bằng CI thật** — push nhánh lên GitHub, mở PR → xác nhận 5 job xanh trên PR (chủ dự án thêm secrets trước khi merge nếu chưa có). Sửa workflow nếu có job đỏ.

- [ ] **Bước 4: Commit**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "ci: GitHub Actions 5 job + docs test va secrets"
```

---

## Handoff

Sau khi merge, dự án đạt: test tối đa xanh, CI chạy mỗi push/PR, Next.js 16.2 + React 19.2 trên production, dữ liệu production không bị đụng bởi test. Các sub-project tiếp theo (đa game, ảnh & logo, giải đấu chi tiết, lịch sử chỉnh sửa, backup/export + OG image) bắt đầu từ nền tảng này.
