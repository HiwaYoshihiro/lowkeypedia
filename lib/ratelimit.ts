/**
 * Giới hạn tần suất theo IP: số lần thử đăng nhập quản trị và (phần cuối file)
 * giới hạn chung cho các route như `/api/search`.
 *
 * Bộ đếm nằm trong bộ nhớ tiến trình nên trên serverless mỗi instance giữ riêng:
 * đây là một lớp giảm nhẹ (chặn dò mật khẩu / gọi dồn dập từ một IP) chứ không
 * phải tường lửa hoàn chỉnh. Muốn chắc chắn hơn thì cần một store dùng chung
 * (Redis/Upstash) — khi đó chỉ cần thay hai hàm bên dưới.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 phút
/**
 * Số lần thử tối đa trong một cửa sổ. Mặc định 8 — giữ nguyên hành vi cũ.
 * Đặt `LOGIN_RATE_LIMIT_MAX` để hạ/nâng ngưỡng (dùng cho e2e test).
 */
const MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 8) || 8;

/**
 * Một "xô" đếm request của một khoá.
 * `windowMs` chỉ có ở khoá do `checkRateLimit` tạo; khoá login dùng cửa sổ mặc định.
 */
type Bucket = { count: number; first: number; windowMs?: number };

const buckets = new Map<string, Bucket>();

/** Xoá các bucket đã hết cửa sổ để map không phình mãi. */
function pruneExpired(now: number): void {
  buckets.forEach((v, k) => {
    if (now - v.first > (v.windowMs ?? WINDOW_MS)) buckets.delete(k);
  });
}

/** Lấy IP client sau proxy của Vercel. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function isRateLimited(key: string): boolean {
  const b = buckets.get(key);
  if (!b) return false;
  if (Date.now() - b.first > WINDOW_MS) return false;
  return b.count >= MAX_ATTEMPTS;
}

export function noteFailure(key: string): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.first > WINDOW_MS) {
    buckets.set(key, { count: 1, first: now });
  } else {
    b.count += 1;
  }
  // Dọn bucket hết hạn khi map phình to, tránh rò rỉ bộ nhớ.
  if (buckets.size > 1000) pruneExpired(now);
}

/** Đăng nhập thành công thì xoá bộ đếm của IP đó. */
export function noteSuccess(key: string): void {
  buckets.delete(key);
}

// ---------- Giới hạn chung cho các route đọc (VD /api/search) ----------

/** `/api/search`: tối đa 60 request trong một phút cho mỗi IP. */
export const SEARCH_RATE_LIMIT_MAX = 60;
export const SEARCH_RATE_WINDOW_MS = 60 * 1000;

/** Kết quả một lượt kiểm tra giới hạn tần suất. */
export interface RateLimitResult {
  /** true = đã vượt ngưỡng, request nên bị từ chối. */
  limited: boolean;
  /** Số giây nên chờ trước khi thử lại (0 khi chưa bị chặn). */
  retryAfter: number;
}

/**
 * Đếm và kiểm tra tần suất cho một khoá bất kỳ (VD `search:<ip>`).
 *
 * Mỗi lượt gọi đều được ghi nhận; request thứ `max + 1` trong cùng cửa sổ bị chặn.
 * Dùng khoá có tiền tố riêng để không giẫm lên bộ đếm đăng nhập.
 *
 * Vẫn là bộ đếm in-memory như ghi chú đầu file: trên serverless mỗi instance giữ
 * riêng nên chỉ chặn được client gọi dồn dập vào cùng một instance. Chấp nhận vì
 * route này chỉ đọc dữ liệu công khai qua `searchAll` (đã có cache 30 giây), và
 * thêm một store dùng chung (Redis/Upstash) là hạ tầng lớn hơn phạm vi wiki này.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.first > windowMs) {
    buckets.set(key, { count: 1, first: now, windowMs });
    if (buckets.size > 1000) pruneExpired(now);
    return { limited: false, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > max) {
    // Làm tròn lên, ít nhất 1 giây để `Retry-After` luôn hợp lệ.
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - b.first)) / 1000));
    return { limited: true, retryAfter };
  }
  return { limited: false, retryAfter: 0 };
}
