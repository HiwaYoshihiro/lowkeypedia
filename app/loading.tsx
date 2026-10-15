/**
 * Khung chờ của App Router: hiện ngay khi điều hướng, trong lúc server render
 * trang đích (các trang dữ liệu đều `force-dynamic` nên lượt tải nguội phải
 * chờ Blob). Giữ đúng hình dáng bài viết để nội dung thật hiện ra không bị
 * "nhảy" bố cục.
 */
export default function Loading() {
  return (
    <div className="article" aria-busy="true">
      <div className="skeleton-stack">
        <span className="skeleton-line" style={{ width: '34%', height: 12 }} />
        <span className="skeleton-line is-title" />
        <span className="skeleton-line" style={{ width: '46%' }} />
        <span className="skeleton-line" style={{ width: '100%', marginTop: 12 }} />
        <span className="skeleton-line" style={{ width: '92%' }} />
        <span className="skeleton-line" style={{ width: '78%' }} />
      </div>
      <span className="visually-hidden" role="status">
        Đang tải nội dung…
      </span>
    </div>
  );
}
