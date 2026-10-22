/**
 * Giới hạn số lần thử đăng nhập quản trị theo IP.
 *
 * Bộ đếm nằm trong bộ nhớ tiến trình nên trên serverless mỗi instance giữ riêng:
 * đây là một lớp giảm nhẹ (chặn dò mật khẩu tốc độ cao từ một IP) chứ không phải
 * tường lửa hoàn chỉnh. Muốn chắc chắn hơn thì cần một store dùng chung
 * (Redis/Upstash) — khi đó chỉ cần thay hai hàm bên dưới.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 phút
/**
 * Số lần thử tối đa trong một cửa sổ. Mặc định 8 — giữ nguyên hành vi cũ.
 * Đặt `LOGIN_RATE_LIMIT_MAX` để hạ/nâng ngưỡng (dùng cho e2e test).
 */
const MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 8) || 8;

type Bucket = { count: number; first: number };

const buckets = new Map<string, Bucket>();

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
  if (buckets.size > 1000) {
    buckets.forEach((v, k) => {
      if (now - v.first > WINDOW_MS) buckets.delete(k);
    });
  }
}

/** Đăng nhập thành công thì xoá bộ đếm của IP đó. */
export function noteSuccess(key: string): void {
  buckets.delete(key);
}
