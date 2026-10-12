# Lowkeypedia

Bách khoa toàn thư mở về **Liên Quân Mobile (Arena of Valor) Việt Nam** — phong cách Wikipedia/Liquipedia:
tiểu sử tuyển thủ, đội tuyển, giải đấu, sự nghiệp, đội hình hiện tại và thành tích.

Giao diện wiki cổ điển (khung `.wiki-container`, infobox, tabs, catalogue) kèm **chế độ tối/sáng**
(chuyển trên header, lưu ở `localStorage` key `theme`, có script chống FOUC trong `app/layout.tsx`).

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS v3
- **Dữ liệu:** Vercel Blob — 3 file JSON `lowkeypedia/data/players.json`,
  `lowkeypedia/data/teams.json`, `lowkeypedia/data/tournaments.json`
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
- Dashboard có 3 tab **Tuyển thủ** / **Đội tuyển** / **Giải đấu**: thêm, sửa, xoá trực tiếp.
  - **Thành tích** (tuyển thủ & đội tuyển): editor dạng bảng kiểu Liquipedia — mỗi dòng gồm
    **Năm**, **Thứ hạng** (in đậm), **Giải đấu** và **Liên kết giải đấu** (chọn từ danh sách giải
    đấu để tên giải trên web thành link tới trang giải tương ứng).
  - **Lịch sử đội tuyển** (form tuyển thủ): mỗi dòng gồm **Giai đoạn**, **Đội tuyển** và
    **Liên kết đội** — hiển thị dạng bảng có link trên trang tuyển thủ.
  - Ô "Lịch sử vô địch" (giải đấu): mỗi dòng một mục.
  - Ô "Tiểu sử" / "Sự nghiệp" / "Mô tả" / "Giới thiệu": văn bản nhiều dòng.
- Sau mỗi lần lưu, cache được xoá và các trang liên quan được revalidate ngay lập tức.

## Cấu trúc dữ liệu

- `lib/store.ts` — `getPlayers`, `getPlayerBySlug`, `getTeams`, `getTeamBySlug`,
  `getPlayersByTeam`, `getTournaments`, `getTournamentBySlug`, `searchAll`,
  `savePlayer`, `deletePlayer`, `saveTeam`, `deleteTeam`, `saveTournament`,
  `deleteTournament`, `clearCache`
- `lib/auth.ts` — HMAC-SHA256 cookie session, `requireAdmin()`
- `data/seed/*.json` — dữ liệu mẫu ban đầu (tự động seed lên Blob khi file chưa có)

## Trang web

- `/` — trang chủ: hero, tuyển thủ nổi bật, đội tuyển, giải đấu, cập nhật gần đây
- `/tuyen-thu`, `/tuyen-thu/[slug]` — danh sách + hồ sơ tuyển thủ (infobox, lịch sử đội tuyển,
  bảng thành tích kiểu Liquipedia có link tới trang giải đấu)
- `/doi-tuyen`, `/doi-tuyen/[slug]` — danh sách + trang đội tuyển (infobox + đội hình + bảng thành tích)
- `/giai-dau`, `/giai-dau/[slug]` — danh sách + trang giải đấu (infobox + lịch sử vô địch)
- `/tim-kiem` — tìm kiếm không dấu cả 3 loại
- `/admin`, `/admin/dashboard` — đăng nhập + quản trị CRUD

Mọi page đọc dữ liệu đều dùng `export const dynamic = 'force-dynamic'` nên
`npm run build` không cần biến môi trường và không gọi Blob ở build time.
