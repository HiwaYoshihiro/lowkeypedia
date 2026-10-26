# Sao lưu & xuất dữ liệu

## Vì sao cần

Dữ liệu thật của wiki (tuyển thủ, đội, giải đấu) nằm trong **Vercel Blob**, mỗi
bảng là một file JSON:

| Bảng | Đường dẫn trên Blob |
| --- | --- |
| Tuyển thủ | `lowkeypedia/data/players.json` |
| Đội tuyển | `lowkeypedia/data/teams.json` |
| Giải đấu | `lowkeypedia/data/tournaments.json` |

Mỗi lần lưu, `lib/store.ts` đọc file → sửa → ghi đè toàn bộ file. Blob **không
giữ lịch sử phiên bản**, nên một thao tác xoá/sửa nhầm là mất luôn dữ liệu cũ.
Bản backup tải về máy là lớp bảo hiểm duy nhất cho tình huống đó.

## Cách tải bản backup

Endpoint: `GET /api/admin/export`

- Chỉ dùng được khi **đã đăng nhập quản trị** (`/admin`). Chưa đăng nhập sẽ nhận
  `401` kèm `{"error":"Chưa đăng nhập quản trị"}`.
- Cách đơn giản nhất: đăng nhập vào trang quản trị, rồi mở `/api/admin/export`
  trên cùng trình duyệt — file sẽ được tải xuống.
- Response gồm các header:

| Header | Giá trị |
| --- | --- |
| `Content-Type` | `application/json; charset=utf-8` |
| `Content-Disposition` | `attachment; filename="lwkypedia-backup-YYYY-MM-DD.json"` |
| `Cache-Control` | `no-store` |

Ngày trong tên file lấy theo **UTC** và luôn khớp với trường `exportedAt` bên
trong file (hai giá trị sinh ra từ cùng một mốc thời gian).

Nội dung file:

```json
{
  "exportedAt": "2026-10-26T07:57:04.000Z",
  "players": [],
  "teams": [],
  "tournaments": []
}
```

Route khai báo `export const dynamic = 'force-dynamic'` và `Cache-Control:
no-store` để trình duyệt/CDN không bao giờ trả một bản chụp cũ.

## Khi nào nên tải

- Trước mỗi đợt sửa dữ liệu lớn (nhập hàng loạt tuyển thủ, đổi slug đội/giải —
  thao tác này ghi sang cả file khác).
- Định kỳ (ví dụ mỗi tuần) và giữ vài bản gần nhất ở nơi **ngoài Vercel**.
- File backup chỉ chứa nội dung công khai của wiki (không có mật khẩu, token hay
  cookie), nên không cần mã hoá — nhưng vẫn nên để trong thư mục riêng.

## Khôi phục

Hiện **chưa có** endpoint nhập dữ liệu. Cách khôi phục thủ công:

1. Mở file backup, lấy đúng mảng cần khôi phục (`players`, `teams` hoặc
   `tournaments`).
2. Ghi đè file Blob tương ứng trong bảng ở trên bằng chính mảng đó (không phải
   cả object backup), dạng JSON, giữ nguyên đường dẫn.
3. `lib/store.ts` cache dữ liệu trong bộ nhớ khoảng 30 giây, nên bản mới có thể
   cần tối đa khoảng 30 giây mới hiện ra trên mỗi instance đang chạy.

Nếu chỉ sửa một vài bản ghi, nên làm qua giao diện quản trị để mọi thay đổi đều
đi qua `lib/store.ts` (giữ khoá ghi và tự xoá cache), thay vì sửa trực tiếp Blob.
