/**
 * RichText — render văn bản có cú pháp **in đậm** (markdown cơ bản).
 * - Escape HTML trước để tránh XSS.
 * - **chữ** → <strong>chữ</strong>.
 * - Xuống dòng giữ nguyên (class text-pre xử lý white-space: pre-line).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderRichText(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}

export default function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <p
      className={className}
      dangerouslySetInnerHTML={{ __html: renderRichText(text) }}
    />
  );
}
