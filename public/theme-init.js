/**
 * Đặt giao diện sáng/tối trước khi trình duyệt vẽ trang.
 *
 * Nằm ở tệp riêng (thay vì `<script>` nội tuyến trong layout) để CSP nonce
 * không phải cấp phép cho script nội tuyến nào ngoài dữ liệu JSON-LD. Script
 * này chặn parser cho tới khi chạy xong nên vẫn áp theme trước lần vẽ đầu tiên.
 *
 * `?theme=dark|light` cho phép ép giao diện qua URL, hữu ích khi chia sẻ liên kết.
 */
(function () {
  try {
    var params = new URLSearchParams(location.search);
    var forced = params.get('theme');
    var saved = localStorage.getItem('theme');
    var theme =
      forced === 'dark' || forced === 'light'
        ? forced
        : saved === 'dark' || saved === 'light'
          ? saved
          : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
    /* localStorage/matchMedia có thể bị chặn — cứ để giao diện mặc định */
  }
})();
