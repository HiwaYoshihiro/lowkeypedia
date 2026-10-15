import type { MetadataRoute } from 'next';
import { getPlayers, getTeams, getTournaments } from '@/lib/store';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * Sitemap động: trang tĩnh + toàn bộ trang chi tiết tuyển thủ / đội tuyển / giải đấu.
 * Đây là điều kiện để crawler tìm thấy các trang wiki vốn không có liên kết nội bộ nào trỏ tới.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/tuyen-thu`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/doi-tuyen`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/giai-dau`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tim-kiem`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const [players, teams, tournaments] = await Promise.all([
      getPlayers(),
      getTeams(),
      getTournaments(),
    ]);
    const detail = (prefix: string, slug: string, updatedAt?: string): MetadataRoute.Sitemap[number] => {
      // `updatedAt` đến từ JSON có thể bị sửa tay thành giá trị không hợp lệ —
      // ngày Invalid Date sẽ làm hỏng cả sitemap nên quy về `now`.
      const when = updatedAt ? new Date(updatedAt) : now;
      return {
        url: `${base}${prefix}/${slug}`,
        lastModified: Number.isNaN(when.getTime()) ? now : when,
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    };
    return [
      ...staticRoutes,
      ...players.map((p) => detail('/tuyen-thu', p.slug, p.updatedAt)),
      ...teams.map((t) => detail('/doi-tuyen', t.slug, t.updatedAt)),
      ...tournaments.map((t) => detail('/giai-dau', t.slug, t.updatedAt)),
    ];
  } catch {
    return staticRoutes;
  }
}
