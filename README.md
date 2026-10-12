# Lowkeypedia

Bách khoa toàn thư mở về **Liên Quân Mobile (Arena of Valor) Việt Nam** — phong cách Wikipedia/Liquipedia:
tiểu sử tuyển thủ, đội tuyển, sự nghiệp, đội hình hiện tại và thành tích.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS v3
- **Dữ liệu:** Vercel Blob — 2 file JSON `lowkeypedia/data/players.json` và `lowkeypedia/data/teams.json`
  (store `lowkeypedia-data`), đọc qua `@vercel/blob` SDK, cache in-memory TTL 30 giây.
- **Quản trị:** đăng nhập bằng mật khẩu (`/admin`), cookie `lk_admin` ký HMAC-SHA256.

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền các biến bên dưới
npm run dev
```

Mở http://localhost:3000

### Biến môi trường

| Biến | Mô tả |
| ---- | ----- |
| `BLOB_READ_WRITE_TOKEN` | Read/write token của Blob store `lowkeypedia-data` (Vercel Dashboard → Storage → Connect → `.env.local`). Nếu thiếu, web vẫn chạy bằng dữ liệu seed kèm sẵn (chỉ đọc). |
| `ADMIN_PASSWORD` | Mật khẩu đăng nhập trang `/admin` |
| `ADMIN_SECRET` | Chuỗi bí mật dài, dùng ký cookie admin |

## Deploy lên Vercel

1. Push repo lên GitHub, import vào Vercel (Framework Preset: Next.js).
2. Tạo Blob store tên `lowkeypedia-data` (Storage → Create → Blob) rồi **Connect** vào project
   — Vercel sẽ tự thêm `BLOB_READ_WRITE_TOKEN`.
3. Thêm biến môi trường `ADMIN_PASSWORD` và `ADMIN_SECRET` (Project Settings → Environment Variables).
4. Deploy. Lần truy cập đầu tiên, web sẽ tự seed dữ liệu mẫu lên Blob nếu file JSON chưa tồn tại.

## Quản trị dữ liệu

- Truy cập `/admin`, đăng nhập bằng `ADMIN_PASSWORD`.
- Dashboard có 2 tab **Tuyển thủ** / **Đội tuyển**: thêm, sửa, xoá trực tiếp.
  - Ô "Thành tích": mỗi dòng một thành tích.
  - Ô "Tiểu sử" / "Sự nghiệp" / "Mô tả": văn bản nhiều dòng.
- Sau mỗi lần lưu, cache được xoá và các trang liên quan được revalidate ngay lập tức.

## Cấu trúc dữ liệu

- `lib/store.ts` — `getPlayers`, `getPlayerBySlug`, `getTeams`, `getTeamBySlug`,
  `getPlayersByTeam`, `searchAll`, `savePlayer`, `deletePlayer`, `saveTeam`, `deleteTeam`, `clearCache`
- `lib/auth.ts` — HMAC-SHA256 cookie session, `requireAdmin()`
- `data/seed/*.json` — dữ liệu mẫu ban đầu (tự động seed lên Blob khi file chưa có)

Mọi page đọc dữ liệu đều dùng `export const dynamic = 'force-dynamic'` nên
`npm run build` không cần biến môi trường và không gọi Blob ở build time.
