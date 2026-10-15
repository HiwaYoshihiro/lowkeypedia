import { revalidatePath } from 'next/cache';

/**
 * Revalidate các trang công khai sau khi dữ liệu thay đổi.
 *
 * `revalidatePath('/', 'layout')` xoá cache của mọi route bên dưới layout gốc,
 * nên chỉ cần gọi một lần là phủ toàn bộ site — trước đây mỗi route file tự khai
 * một helper riêng (6 bản trùng nhau) và thiếu `/doi-tuyen/[slug]`,
 * `/giai-dau/[slug]`, `/tuyen-thu/[slug]`.
 */
export function revalidateSite(): void {
  revalidatePath('/', 'layout');
}
