/** Tiện ích dùng chung cho các trang: ép searchParams về một giá trị vô hướng. */

/**
 * Next.js truyền `string[]` khi một query key lặp lại (`?q=a&q=b`).
 * `searchParams.q ?? ''` khi đó là mảng nên `.trim()` sẽ ném lỗi → HTTP 500.
 * Luôn lấy phần tử đầu tiên để URL hỏng không làm sập trang.
 */
export function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

/**
 * Bỏ cú pháp **in đậm** và gộp khoảng trắng trước khi cắt thành meta description.
 *
 * Nhận `unknown` vì dữ liệu đến từ Blob JSON (có thể thiếu field nếu file bị sửa tay);
 * ép về chuỗi để một bản ghi khuyết `description` không làm sập `generateMetadata`.
 */
export function stripMarkdown(text: unknown, max = 160): string {
  if (typeof text !== 'string') return '';
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
