/**
 * Thẻ JSON-LD (schema.org) để công cụ tìm kiếm hiểu nội dung là các thực thể
 * (tuyển thủ / đội tuyển / giải đấu) chứ không chỉ là văn bản.
 *
 * `JSON.stringify` không escape `<`, nên một chuỗi chứa `</script>` có thể thoát
 * khỏi thẻ script. Thay `<`, `>` và `&` bằng escape unicode — vẫn là JSON hợp lệ.
 */
function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  );
}

/** BreadcrumbList từ danh sách [tên, url] đã dựng sẵn. */
export function breadcrumbJsonLd(base: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
