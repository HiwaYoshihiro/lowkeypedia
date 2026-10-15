import type { Metadata } from 'next';

/**
 * Khu vực quản trị: chặn crawler lập chỉ mục.
 * Trang `/admin` và `/admin/dashboard` là Client Component nên không tự export
 * được `metadata`; layout này áp cho cả hai.
 */
export const metadata: Metadata = {
  title: 'Quản trị',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
