# Spec: Nền tảng — Tests + CI + Nâng cấp Next.js 16

- **Ngày:** 2026-10-23
- **Trạng thái:** Chờ duyệt → viết plan
- **Sub-project:** 1/6 trong lộ trình cải thiện LWKYPEDIA (xem "Bối cảnh")
- **Phân loại:** Architectural

## Bối cảnh

LWKYPEDIA là wiki esports Liên Quân Mobile VN: Next.js 14 App Router + TypeScript +
Tailwind, dữ liệu là 3 file JSON trên Vercel Blob (cache SWR, seed fallback), admin
CRUD có đăng nhập (HMAC + rate limit), SEO/JSON-LD/sitemap, dark mode, security headers.

Lộ trình cải thiện đã thống nhất với chủ dự án (mỗi mục là một sub-project riêng):

1. **Nền tảng: Tests + CI + nâng cấp Next.js 16** ← spec này
2. Đa game (tab game khác, không chỉ Liên Quân)
3. Ảnh & logo + hồ sơ phong phú
4. Giải đấu chi tiết (bracket, từng trận, mùa)
5. Lịch sử chỉnh sửa + audit log
6. Backup/export JSON + OG image động

Sub-project này làm nền để mọi thay đổi lớn sau đó có lưới an toàn kiểm chứng.

## Mục tiêu & phạm vi

**Trong phạm vi:**

- Bộ test "tối đa": Vitest (unit + component) và Playwright (e2e) phủ toàn bộ lib,
  components, trang công khai và luồng admin.
- Coverage: `lib/` ≥ 90% dòng, `components/` ≥ 80% dòng, tổng ≥ 80%.
- CI GitHub Actions: lint, typecheck, unit+coverage, build, e2e.
- Nâng cấp Next.js 14 → 16.2.x + React 19.2, Node ≥ 20.9, ESLint 9 flat config,
  Turbopack mặc định.
- README cập nhật.

**Ngoài phạm vi:** các sub-project 2–6 nêu trên; thay đổi hành vi người dùng cuối.

## Quyết định đã chốt (từ brainstorm)

- Mức test: **tối đa** (unit + e2e toàn diện, ngưỡng coverage cao).
- Đích nâng cấp: **Next.js 16 mới nhất** (16.2.x) + React 19.2.
- Cách tiếp cận: **A — Lưới an toàn trước**: test xanh trên Next 14 → nâng cấp →
  test vẫn xanh → CI.

## Thiết kế 1: Cấu trúc bộ test

**Unit (Vitest + jsdom + @testing-library/react + user-event):**

- `lib/` toàn bộ: `slug`, `mentions`, `entities`, `params`, `site` (thuần túy);
  `auth` (HMAC sign/verify, verifyPassword); `ratelimit` (in-memory); `http`;
  `revalidate` (mock `next/cache`); `store.ts` (mock `@vercel/blob`).
- `components/` toàn bộ 18 component (bảng thành tích, infobox, SearchBox bằng
  `user-event`, ThemeToggle, JSON-LD…).
- Trang RSC: smoke render với store đã mock.

**E2E (Playwright, chạy trên bản production build):**

- Công khai: trang chủ, danh sách + chi tiết tuyển thủ/đội/giải, tìm kiếm không dấu
  + gợi ý header, dark/light (chống FOUC), 404, sitemap/robots.
- Admin: đăng nhập (đúng/sai, rate limit), CRUD đầy đủ 3 loại, editor bảng thành
  tích, cascade đổi/xóa slug không để link chết.

**File mới:** `vitest.config.ts`, `vitest.setup.ts`, `tests/unit/**`,
`tests/e2e/**`, `playwright.config.ts`, `.github/workflows/ci.yml`,
`eslint.config.mjs` (thay `.eslintrc.json`).

**Script mới:** `test`, `test:unit`, `test:e2e`, `test:coverage`.

## Thiết kế 2: Chiến lược dữ liệu test

- **Unit:** mock module `@vercel/blob` bằng blob ảo trong bộ nhớ; kịch bản cố định
  (cache nguội, hết TTL, lỗi đọc trả seed tạm, ghi an toàn, cascade slug). Không mạng.
- **E2E công khai:** webServer không có token Blob → chế độ chỉ đọc trên seed;
  kỳ vọng khớp seed. Khi seed đổi, kỳ vọng e2e cập nhật theo (test = tài liệu hành vi).
- **E2E admin:** dùng Blob store test riêng (`lowkeypedia-data-test`), token qua
  GitHub secret `BLOB_READ_WRITE_TOKEN_TEST`; webServer khởi động với
  `BLOB_READ_WRITE_TOKEN` trỏ store test + `ADMIN_PASSWORD_TEST`/`ADMIN_SECRET_TEST`.
  Tự seed lần đầu. Thực thể tạo ra mang hậu tố ngẫu nhiên và được xóa cuối test.
  Local chạy qua `.env.test.local`.
- **Thay đổi code sản phẩm duy nhất:** biến môi trường `LOGIN_RATE_LIMIT_MAX`
  (mặc định = giá trị hiện tại) để test rate limit không khóa các test khác
  (rate limit theo IP, Playwright chạy cùng IP).

## Thiết kế 3: Nâng cấp Next.js 14 → 16

| Breaking change | Áp dụng? | Xử lý |
|---|---|---|
| `params`/`searchParams`/`cookies()` → Promise | Có | Codemod `@next/codemod upgrade` + sửa tay theo `typecheck` |
| `next lint` bị gỡ → ESLint CLI + flat config | Có | Codemod `next-lint-to-eslint-cli`; eslint 9; `eslint.config.mjs` |
| Turbopack mặc định | Có | Verify `next.config` (headers/security); chuyển `next.config.ts` |
| Node ≥ 20.9, TS ≥ 5.1 | Có | `"engines"` trong package.json; CI Node 22; TS 5.x mới |
| React 19.2 | Có | Bump react/react-dom/@types/react 19; rà pattern legacy |
| `middleware.ts` → `proxy.ts` | Không (repo không có) | Bỏ qua |
| Fetch không cache mặc định | Không ảnh hưởng (Blob qua SDK) | Bỏ qua |

**Thứ tự:** codemod → bump deps → `typecheck` + `lint` sạch → toàn bộ test xanh →
screenshot kiểm tra trực quan → deploy Vercel preview → xác nhận → production.

**Fallback:** nếu Turbopack × Tailwind/PostCSS trục trặc, tạm `next build --webpack`
và ghi chú. Verify API `@vercel/blob` sau khi bump (repo chỉ dùng `list`/`put`).

**Rollback:** git tag + Vercel instant rollback.

## Thiết kế 4: CI GitHub Actions

Workflow `ci.yml`, trigger push `main` + PR, concurrency hủy lượt cũ.

| Job | Chạy | Ngưỡng |
|---|---|---|
| `lint` | `eslint .` | 0 lỗi |
| `typecheck` | `tsc --noEmit` | 0 lỗi |
| `unit` | `vitest run --coverage` | lib ≥ 90%, components ≥ 80%, tổng ≥ 80%; artifact coverage |
| `build` | `next build` (Turbopack) | thành công |
| `e2e` | build → `next start` → Playwright | pass toàn bộ; artifact report khi fail |

- Node 22 LTS, `npm ci`, cache npm/`.next`/Playwright.
- Secrets job e2e: `BLOB_READ_WRITE_TOKEN_TEST`, `ADMIN_PASSWORD_TEST`,
  `ADMIN_SECRET_TEST`.
- PR từ fork: job `e2e` skip (không có secrets), còn lại chạy bình thường.
- Gợi ý bật required checks cho `main`.

## Rủi ro & giảm thiểu

1. Turbopack × Tailwind/PostCSS → fallback `--webpack` tạm thời.
2. `@vercel/blob` bump → API dùng là ổn định; verify sau bump.
3. E2E công khai gắn với seed → cập nhật kỳ vọng khi seed đổi (đặc tính, không phải lỗi).
4. Hai PR e2e song song đụng store test → hậu tố ngẫu nhiên, rủi ro còn lại chấp nhận.
5. Ngưỡng coverage gây gánh nặng → điều chỉnh dựa trên số liệu thật sau này.

## Definition of Done

- CI xanh 5 job trên `main` và PR; coverage đạt ngưỡng.
- Next.js 16.2.x + React 19.2 trên production; toàn bộ e2e xanh; không hồi quy trên
  Vercel preview.
- Hành vi người dùng cuối không đổi (ngoại lệ duy nhất `LOGIN_RATE_LIMIT_MAX`).
- Dữ liệu production không bị đụng bởi bất kỳ test nào.
- README cập nhật: script mới, Node 20.9+, hướng dẫn test + tạo store test.

## Việc chủ dự án cần làm (ở bước thực hiện)

- Tạo Blob store test trên Vercel và lấy read/write token.
- Thêm GitHub secrets: `BLOB_READ_WRITE_TOKEN_TEST`, `ADMIN_PASSWORD_TEST`,
  `ADMIN_SECRET_TEST`.
- (Tùy chọn) Bật required checks cho nhánh `main`.
